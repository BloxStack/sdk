import {
	ProcedureDef,
	ProcedureHandler,
	RuntimeCheck,
	RouterRoot,
	RouterTree,
	InferCheckType,
	OptionalizeUndefined,
} from "./types";
import { t } from "@rbxts/t";

// A chainable procedure builder capturing validators and middleware, without binding to transport.

/**
 * Chainable builder for defining a procedure.
 *
 * - `use` allows refining/augmenting the context (similar to tRPC middleware)
 * - `input` and `output` accept `t.check<T>` (or any type guard) and are optional
 * - `query` and `mutation` finalize the definition with a handler
 */
export interface ProcedureBuilder<Context, Input, Output> {
	use<NextContext>(
		mw: (ctx: Context) => NextContext | Promise<NextContext>,
	): ProcedureBuilder<NextContext, Input, Output>;
	input<TCheck extends RuntimeCheck<any>>(
		check: TCheck,
	): ProcedureBuilder<Context, OptionalizeUndefined<t.static<TCheck>>, Output>;
	output<TCheck extends RuntimeCheck<any>>(check: TCheck): ProcedureBuilder<Context, Input, t.static<TCheck>>;
	/**
	 * Finalize as a query. If no `.output(...)` was provided, `Output` will be inferred
	 * from this handler's return type.
	 */
	query<O2 = Output>(handler: ProcedureHandler<Context, Input, O2>): ProcedureDef<Context, Input, O2>;
	/**
	 * Finalize as a mutation. If no `.output(...)` was provided, `Output` will be inferred
	 * from this handler's return type.
	 */
	mutation<O2 = Output>(handler: ProcedureHandler<Context, Input, O2>): ProcedureDef<Context, Input, O2>;
}

export function createProcedure<Context>(): ProcedureBuilder<Context, unknown, unknown> {
	const middlewares: Array<(ctx: unknown) => unknown | Promise<unknown>> = [];
	let inputCheck: RuntimeCheck<any> | undefined;
	let outputCheck: RuntimeCheck<any> | undefined;

	function withState<C, I, O>(): ProcedureBuilder<C, I, O> {
		return {
			use<NC>(mw: (ctx: C) => NC | Promise<NC>) {
				middlewares.push(mw as any);
				return withState<NC, I, O>();
			},
			input<TCheck extends RuntimeCheck<any>>(check: TCheck) {
				inputCheck = check as any;
				return withState<C, OptionalizeUndefined<t.static<TCheck>>, O>();
			},
			output<TCheck extends RuntimeCheck<any>>(check: TCheck) {
				outputCheck = check as any;
				return withState<C, I, t.static<TCheck>>();
			},
			query<O2>(handler: ProcedureHandler<C, I, O2>) {
				return {
					kind: "query",
					inputCheck,
					outputCheck: outputCheck as RuntimeCheck<O2> | undefined,
					middlewares: [...middlewares],
					handler: handler as any,
				} as ProcedureDef<C, I, O2>;
			},
			mutation<O2>(handler: ProcedureHandler<C, I, O2>) {
				return {
					kind: "mutation",
					inputCheck,
					outputCheck: outputCheck as RuntimeCheck<O2> | undefined,
					middlewares: [...middlewares],
					handler: handler as any,
				} as ProcedureDef<C, I, O2>;
			},
		};
	}

	return withState<Context, unknown, unknown>();
}

export interface RouterFactory<Ctx> {
	/** Start a new procedure builder with this context */
	procedure: () => ProcedureBuilder<Ctx, unknown, unknown>;
	/** Construct a typed router from a tree of procedures and nested routers */
	router<T extends RouterTree>(tree: T): RouterRoot<T>;
}

/**
 * Create a router factory parameterized by a root context type.
 *
 * Example:
 * const r = createRouter<Ctx>();
 * const publicProcedure = r.procedure();
 * const router = r.router({ player: { getStats: publicProcedure.query(...) } })
 */
export function createRouter<Ctx = unknown>(): RouterFactory<Ctx> {
	return {
		procedure: () => createProcedure<Ctx>(),
		router<T extends RouterTree>(tree: T): RouterRoot<T> {
			return { __type: tree } as RouterRoot<T>;
		},
	};
}
