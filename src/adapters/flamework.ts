import { Flamework, Modding } from "@flamework/core";
import { BloxStackAdapter, BloxStackScopeAdapter } from "../types";

/**
 * @metadata macro {@link _addPaths intrinsic-flamework-rewrite}
 */
export function flameworkAdapter<A extends string, B extends string>(
	config: {
		ClientPath: A;
		ServerPath: B;
	},
	metaA?: Modding.Intrinsic<"path", [A]>,
	metaB?: Modding.Intrinsic<"path", [B]>,
): BloxStackAdapter<"flamework", BloxStackScopeAdapter, BloxStackScopeAdapter> {
	return {
		name: "flamework",

		client: () => {
			Flamework.addPaths(config.ClientPath, metaA as never);
			Flamework.ignite();

			return new BloxStackScopeAdapter();
		},
		server: () => {
			Flamework.addPaths(config.ServerPath, metaB as never);
			Flamework.ignite();

			return new BloxStackScopeAdapter();
		},
	};
}
