import { Flamework, Modding } from "@flamework/core";
import { BloxStackAdapter, BloxStackScopeAdapter } from "../types";

const Global = _G as { required: boolean };

/**
 * @metadata macro {@link _addPaths intrinsic-flamework-rewrite}
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
			if (!Global.required) {
				Flamework.addPaths(config.ClientPath, metaA as never);
				Flamework.ignite();

				Global.required = true;
			}

			return new BloxStackScopeAdapter();
		},
		server: () => {
			if (!Global.required) {
				Flamework.addPaths(config.ServerPath, metaB as never);
				Flamework.ignite();

				Global.required = true;
			}

			return new BloxStackScopeAdapter();
		},
	};
}
