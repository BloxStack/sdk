import { RunService } from "@rbxts/services";
import { createClient } from "./client";
import { registerServerRouter } from "./server";
import { RouterClientTransport, RouterServerTransport } from "./transport";
import { InvalidateMessage, RouterRoot, RouterTree, ServerInvalidationTarget } from "./types";
import { QueryClient } from "../query/client";
import { createPaths } from "./paths";
import type { PathHelpersOfTree } from "./paths";
import type { ClientApiOfTree } from "./types";

export interface CreateRouterRuntimeOptions<Context> {
	transport: RouterClientTransport | RouterServerTransport;
	createContext: (opts: { player: Player }) => Context | Promise<Context>;
	queryClient?: QueryClient; // optional on client; if provided we auto-wire invalidations
}

/**
 * Creates a shared runtime that can be called from a file in `shared/`.
 * It switches behavior based on RunService and returns client or server helpers accordingly.
 */
/**
 * Create a shared router runtime usable from `shared/`.
 * - On the client, returns `{ api, paths, dispose }` and optionally wires invalidations to the provided QueryClient.
 * - On the server, returns `{ paths, invalidate }` for invalidating path keys or specific query keys.
 */
export interface ClientRouterRuntime<TTree extends RouterTree> {
	api: ClientApiOfTree<TTree>;
	paths: PathHelpersOfTree<TTree>;
	dispose: () => void;
}

export interface ServerRouterRuntime<TTree extends RouterTree> {
	invalidate: (msg: InvalidateMessage, target: ServerInvalidationTarget) => void;
	paths: PathHelpersOfTree<TTree>;
}

export function createBloxStackRouter<TRouterTree extends RouterTree, Context>(
	root: RouterRoot<TRouterTree>,
	options: CreateRouterRuntimeOptions<Context>,
): ClientRouterRuntime<TRouterTree> | ServerRouterRuntime<TRouterTree> {
	const isClient = RunService.IsClient();
	if (isClient) {
		const { api, dispose } = createClient(
			root.__type,
			options.transport as RouterClientTransport,
			options.queryClient,
		);
		const paths = createPaths(root.__type);
		return { api, paths, dispose } as ClientRouterRuntime<TRouterTree>;
	}
	const server = registerServerRouter(root.__type, options.transport as RouterServerTransport, {
		createContext: options.createContext,
	});
	const paths = createPaths(root.__type);
	return { invalidate: server.invalidate, paths } as ServerRouterRuntime<TRouterTree>;
}

/** Narrow a runtime to the client shape with a runtime check for safety. */
export function expectClientRuntime<TRouterTree extends RouterTree>(
	runtime: ClientRouterRuntime<TRouterTree> | ServerRouterRuntime<TRouterTree>,
): ClientRouterRuntime<TRouterTree> {
	if (!RunService.IsClient()) error("Expected client runtime");
	return runtime as ClientRouterRuntime<TRouterTree>;
}

/** Narrow a runtime to the server shape with a runtime check for safety. */
export function expectServerRuntime<TRouterTree extends RouterTree>(
	runtime: ClientRouterRuntime<TRouterTree> | ServerRouterRuntime<TRouterTree>,
): ServerRouterRuntime<TRouterTree> {
	if (RunService.IsClient()) error("Expected server runtime");
	return runtime as ServerRouterRuntime<TRouterTree>;
}
