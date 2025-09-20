import { RouterTree } from "./types";

export type PathHelpersOfTree<TTree extends RouterTree> = {
	[K in keyof TTree & string]: TTree[K] extends { kind: string }
		? {
				pathKey(): string;
				queryKey(input?: unknown): [string, unknown?];
			}
		: TTree[K] extends RouterTree
			? PathHelpersOfTree<TTree[K]>
			: never;
};

function buildPaths<TTree extends RouterTree>(root: TTree, prefix: string): PathHelpersOfTree<TTree> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of pairs(root as unknown as Record<string, unknown>)) {
		const name = key as string;
		const nextPath = prefix === "" ? name : `${prefix}.${name}`;
		const v = value as unknown;
		if (
			typeOf(v as defined) === "table" &&
			(v as { kind?: unknown; handler?: unknown }).kind !== undefined &&
			(v as { kind?: unknown; handler?: unknown }).handler !== undefined
		) {
			out[name] = {
				pathKey() {
					return nextPath;
				},
				queryKey(input?: unknown) {
					return [nextPath, input] as [string, unknown?];
				},
			};
		} else if (typeOf(v) === "table") {
			out[name] = buildPaths(v as RouterTree, nextPath);
		}
	}
	return out as PathHelpersOfTree<TTree>;
}

/**
 * Builds a lightweight `paths` helper object from a router tree that exposes `pathKey()` and `queryKey(input?)`.
 * Useful for server-side invalidation and for constructing query keys without importing client API.
 */
export function createPaths<TTree extends RouterTree>(root: TTree): PathHelpersOfTree<TTree> {
	return buildPaths(root, "");
}
