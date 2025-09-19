import { Flamework } from "@flamework/core";
import { BloxStackAdapter, BloxStackScopeAdapter } from "../types";

export interface FlameworkAdapterConfig {
	ServerPaths: string[];
	ClientPaths: string[];
}

export class FlameworkAdapterClient extends BloxStackScopeAdapter {
	init(config: FlameworkAdapterConfig) {
		for (const path of config.ClientPaths) {
			Flamework.addPaths(path);
		}
		Flamework.ignite();
	}
}
export class FlameworkAdapterServer extends BloxStackScopeAdapter {
	init(config: FlameworkAdapterConfig) {
		for (const path of config.ServerPaths) {
			Flamework.addPaths(path);
		}
		Flamework.ignite();
	}
}

export function flameworkAdapter(
	config: FlameworkAdapterConfig,
): BloxStackAdapter<"flamework", FlameworkAdapterClient, FlameworkAdapterServer> {
	return {
		name: "flamework",
		client: () => {
			const client = new FlameworkAdapterClient();
			client.init(config);
			return client;
		},
		server: () => {
			const server = new FlameworkAdapterServer();
			server.init(config);
			return server;
		},
	};
}
