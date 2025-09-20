import { ProcedureDef, RouterTree, InvalidateMessage, ServerInvalidationTarget } from "./types";
import { RouterServerTransport } from "./transport";

/**
 * Depth-first traversal over the router tree invoking `cb` for each procedure.
 */
function isProc(val: unknown): val is ProcedureDef<unknown, unknown, unknown> {
	if (typeOf(val as defined) !== "table") return false;
	const t = val as { kind?: unknown; handler?: unknown };
	return t.kind !== undefined && t.handler !== undefined;
}

function forEachProcedure(
	tree: RouterTree,
	prefix: string,
	cb: (pathKey: string, proc: ProcedureDef<any, any, any>) => void,
) {
	for (const [key, value] of pairs(tree as unknown as Record<string, unknown>)) {
		const name = key as string;
		const nextPath = prefix === "" ? name : `${prefix}.${name}`;
		const v = value as unknown;
		if (isProc(v)) {
			cb(nextPath, v);
		} else if (typeOf(v as defined) === "table") {
			forEachProcedure(v as RouterTree, nextPath, cb);
		}
	}
}

export interface RegisterServerOptions<Context> {
	createContext: (opts: { player: Player }) => Context | Promise<Context>;
}

export interface ServerRuntime {
	invalidate: (msg: InvalidateMessage, target: ServerInvalidationTarget) => void;
}

export function registerServerRouter<Context>(
	tree: RouterTree,
	transport: RouterServerTransport,
	options: RegisterServerOptions<Context>,
): ServerRuntime {
	forEachProcedure(tree, "", (pathKey, proc) => {
		transport.register(pathKey, async (player, rawInput) => {
			// input validation (optional)
			if (proc.inputCheck && !proc.inputCheck(rawInput)) {
				return { ok: false, error: { code: "BAD_REQUEST" as const, message: "Invalid input" } };
			}

			const baseCtx = await options.createContext({ player });
			let ctx: unknown = baseCtx;
			for (const mw of proc.middlewares) {
				ctx = await mw(ctx);
			}

			try {
				const data = await proc.handler({ ctx: ctx as any, input: rawInput as any });
				if (proc.outputCheck && !proc.outputCheck(data)) {
					return { ok: false, error: { code: "INTERNAL" as const, message: "Invalid output" } };
				}
				return { ok: true, data };
			} catch (e) {
				const message = tostring(e);
				return { ok: false, error: { code: "INTERNAL" as const, message } };
			}
		});
	});

	return {
		invalidate: (msg, target) => transport.emitInvalidate(msg, target),
	};
}
