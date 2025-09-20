import { Flamework, Modding } from "@flamework/core";
import { BloxStackAdapter, BloxStackScopeAdapter } from "../types";

/**
 * @metadata macro intrinsic-arg-shift {@link _addPaths intrinsic-flamework-rewrite}
 */
export function flameworkAdapter<A extends string, B extends string>(
	config: {
		ServerPath: A;
		ClientPath: B;
	},
	metaA?: Modding.Intrinsic<"path", [A]>,
	metaB?: Modding.Intrinsic<"path", [B]>,
): BloxStackAdapter<"flamework", BloxStackScopeAdapter, BloxStackScopeAdapter> {
	return {
		name: "flamework",
		client: () => {
			Flamework.addPaths(
				config.ClientPath,
				metaA as never,
			); /* metaA and config being pushed down is a weird flamework macro byproduct i assume. */
			Flamework.ignite();

			return new BloxStackScopeAdapter();
		},
		server: () => {
			Flamework.addPaths(config.ServerPath, config as never);
			Flamework.ignite();

			return new BloxStackScopeAdapter();
		},
	};
}
