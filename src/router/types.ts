// Router core shared types (no transport/React dependencies)

export type Awaitable<T> = T | Promise<T>;

// Lightweight validator compatible with @rbxts/t's `t.check<T>` without importing it
export type RuntimeCheck<T> = (value: unknown) => value is T;

export type ProcedureKind = "query" | "mutation";

export interface ProcedureHandler<Context, Input, Output> {
	(opts: { ctx: Context; input: Input }): Awaitable<Output>;
}

export type Middleware<Context, NextContext> = (ctx: Context) => Awaitable<NextContext>;

// Internal canonical procedure definition captured at build-time
export interface ProcedureDef<Context, Input, Output> {
	kind: ProcedureKind;
	/** optional input validator */
	inputCheck?: RuntimeCheck<Input>;
	/** optional output validator */
	outputCheck?: RuntimeCheck<Output>;
	/** middleware chain to construct the final ctx at runtime (server-side) */
	middlewares: Array<(ctx: unknown) => Awaitable<unknown>>;
	/** server-side handler (registered only on server) */
	handler: ProcedureHandler<Context, Input, Output>;
}

// Router tree node: either a nested router or a leaf procedure
export type RouterTree = {
	[key: string]: RouterTree | ProcedureDef<any, any, any>;
};

export interface RouterRoot<TTree extends RouterTree> {
	__type: TTree;
}

// Utility types for path-key inference
export type PathKeyOfTree<TTree extends RouterTree, Prefix extends string = ""> = {
	[K in keyof TTree & string]: TTree[K] extends ProcedureDef<any, any, any>
		? `${Prefix}${K}`
		: TTree[K] extends RouterTree
			? PathKeyOfTree<TTree[K], `${Prefix}${K}.`>
			: never;
}[keyof TTree & string];

export type InputOf<T> = T extends ProcedureDef<any, infer I, any> ? I : never;
export type OutputOf<T> = T extends ProcedureDef<any, any, infer O> ? O : never;
export type ContextOf<T> = T extends ProcedureDef<infer C, any, any> ? C : never;

export type ProceduresInTree<TTree extends RouterTree> = {
	[K in keyof TTree & string]: TTree[K] extends ProcedureDef<any, any, any>
		? TTree[K]
		: TTree[K] extends RouterTree
			? ProceduresInTree<TTree[K]>
			: never;
};

// Client API shape derived from a router tree. This is a minimal foundation and will
// be extended in later phases to include queryOptions/fetch/mutate.
/**
 * Client API surface derived from the router definition. Each leaf exposes helpers:
 * - pathKey(): canonical path string for the procedure
 * - queryKey(input?): cache key tuple used by the QueryClient
 * - queryOptions(input?, opts?): convenience builder for hooks
 * - fetch/mutate: non-React usage
 */
export type ClientApiOfTree<TTree extends RouterTree> = {
	[K in keyof TTree & string]: TTree[K] extends ProcedureDef<infer _C, infer I, infer O>
		? {
				/** canonical path for this procedure, e.g. "player.getStats" */
				pathKey(): string;
				/** build a stable query key for caching */
				queryKey(input?: I): [string, unknown?];
				/** build options object for useQuery */
				queryOptions(
					input?: I,
					opts?: { enabled?: boolean; staleSeconds?: number },
				): { key: [string, unknown?]; fetch: () => Promise<O>; enabled?: boolean; staleSeconds?: number };
				/** fetch function for non-React environments */
				fetch(input: I): Promise<O>;
				/** mutate function for non-React environments */
				mutate(input: I): Promise<O>;
			}
		: TTree[K] extends RouterTree
			? ClientApiOfTree<TTree[K]>
			: never;
};

export interface ServerInvalidationTarget {
	scope: "all" | "player" | "players";
	player?: Player;
	players?: Player[];
}

export interface InvalidateMessage {
	pathKey: string;
	queryKey?: string;
	reason?: string;
}
