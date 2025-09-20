import { ClientApiOfTree, InvalidateMessage, RouterTree } from "./types";
import { QueryClient } from "../query/client";
import { RouterClientTransport } from "./transport";

function stableKey(value: unknown): unknown {
	// Minimal stable key: pass primitives/arrays/tables as-is; adapters can serialize if needed.
	return value;
}

/**
 * Build a strongly-typed client API from the router tree, attaching helpers to each procedure.
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
			api[name] = {
				pathKey() {
					return nextPath;
				},
				queryKey(input?: unknown) {
					return [nextPath, input !== undefined ? stableKey(input) : undefined] as [string, unknown?];
				},
				queryOptions<I = unknown, O = unknown>(input?: I, opts?: { enabled?: boolean; staleSeconds?: number }) {
					const key = [nextPath, input !== undefined ? stableKey(input) : undefined] as [string, unknown?];
					const fetch = () => transport.request<O>(nextPath, input as unknown);
					return { key, fetch, enabled: opts?.enabled, staleSeconds: opts?.staleSeconds };
				},
				async fetch<I = unknown, O = unknown>(input: I) {
					return transport.request<O>(nextPath, input as unknown);
				},
				async mutate<I = unknown, O = unknown>(input: I) {
					return transport.request<O>(nextPath, input as unknown);
				},
			};
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
