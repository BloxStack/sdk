import { ClientApiOfTree, InvalidateMessage, RouterTree } from "./types";
import { QueryClient } from "../query/client";
import { RouterClientTransport } from "./transport";

function stableKey(value: unknown): unknown {
	// Minimal stable key: pass primitives/arrays/tables as-is; adapters can serialize if needed.
	return value;
}

// Create a Lua-compatible proxy that preserves original objects (tRPC-style)
function createProcedureProxy(original: any, pathKey: string, transport: RouterClientTransport): any {
	// Create a new table that inherits from the original
	const proxy = {} as any;

	// Copy all original properties to preserve symbol references
	for (const [key, value] of pairs(original as Record<string, unknown>)) {
		proxy[key] = value;
	}

	// Add client methods
	proxy.pathKey = () => pathKey;
	proxy.queryKey = (input?: unknown) =>
		[pathKey, input !== undefined ? stableKey(input) : undefined] as [string, unknown?];
	proxy.queryOptions = <I = unknown, O = unknown>(input?: I, opts?: { enabled?: boolean; staleSeconds?: number }) => {
		const key = [pathKey, input !== undefined ? stableKey(input) : undefined] as [string, unknown?];
		const fetch = () => transport.request<O>(pathKey, input as unknown);
		return { key, fetch, enabled: opts?.enabled, staleSeconds: opts?.staleSeconds };
	};
	proxy.fetch = async <I = unknown, O = unknown>(input: I) => transport.request<O>(pathKey, input as unknown);
	proxy.mutate = async <I = unknown, O = unknown>(input: I) => transport.request<O>(pathKey, input as unknown);

	// Set the original as the metatable to preserve symbol identity
	setmetatable(proxy, { __index: original });

	return proxy;
}

/**
 * Build a strongly-typed client API from the router tree, preserving original structure (tRPC-style).
 */
function buildClientApi<TTree extends RouterTree>(
	root: TTree,
	transport: RouterClientTransport,
	prefix: string,
): ClientApiOfTree<TTree> {
	const api: Record<string, unknown> = {};
	for (const [key, value] of pairs(root as unknown as Record<string, unknown>)) {
		const name = key as string;
		const nextPath = prefix === "" ? name : `${prefix}.${name}`;
		const v = value as unknown;
		if (
			typeOf(v as defined) === "table" &&
			(v as { kind?: unknown; handler?: unknown }).kind !== undefined &&
			(v as { kind?: unknown; handler?: unknown }).handler !== undefined
		) {
			// Create a proxy that preserves the original procedure
			api[name] = createProcedureProxy(v, nextPath, transport);
		} else if (typeOf(v) === "table") {
			api[name] = buildClientApi(v as RouterTree, transport, nextPath);
		}
	}
	return api as ClientApiOfTree<TTree>;
}

export interface CreateClientResult<TTree extends RouterTree> {
	api: ClientApiOfTree<TTree>;
	dispose: () => void;
}

export function wireInvalidations(client: QueryClient, msg: InvalidateMessage) {
	// If adapter provided a full queryKey string (opaque), prefer direct match
	if (typeIs(msg.queryKey, "string")) {
		const needle = msg.queryKey as unknown as string;
		client.invalidateByPredicate((ks) => ks === needle);
		return;
	}
	client.invalidatePath(msg.pathKey);
}

export function createClient<TTree extends RouterTree>(
	root: TTree,
	transport: RouterClientTransport,
	queryClient?: QueryClient,
): CreateClientResult<TTree> {
	const api = buildClientApi(root, transport, "");
	const off = transport.onInvalidate((msg) => {
		if (queryClient) wireInvalidations(queryClient, msg);
	});
	return { api, dispose: off };
}
