import { Object } from "@rbxts/luau-polyfill";
import { BloxStack, BloxStackAdapter, BloxStackScopeAdapter } from "./types";
import { RunService } from "@rbxts/services";

/* Certain adapters which have custom resolvers */
type AdapterFn = (adapter: BloxStackAdapter) => BloxStackAdapter;

const SpecialAdapters = {
	datastore: (adapter: BloxStackAdapter) => adapter,
	networking: (adapter: BloxStackAdapter) => adapter,
} satisfies Record<string, AdapterFn>;

type SpecialAdapter = keyof typeof SpecialAdapters;

/* Input */
interface BloxStackOptions {
	/* options that are not adapters */
	debugMode?: boolean;
}
interface BloxStackProperties extends Record<SpecialAdapter, BloxStackAdapter>, BloxStackOptions {
	other?: BloxStackAdapter[];
}

/**
 * Entry point function which returns a new BloxStack
 * @param props
 */
export function createBloxStack(props: BloxStackProperties): BloxStack {
	const clientAdapters: BloxStackScopeAdapter[] = [];
	const serverAdapters: BloxStackScopeAdapter[] = [];

	for (const [key, adapter] of Object.entries(props)) {
		const resolver = SpecialAdapters[key as SpecialAdapter];
		if (resolver !== undefined) {
			const { client, server } = resolver(adapter as BloxStackAdapter);
			clientAdapters.push(client);
			serverAdapters.push(server);
		}
	}

	for (const adapter of props.other ?? []) {
		const { client, server } = adapter;
		clientAdapters.push(client);
		serverAdapters.push(server);
	}

	return () => {
		const IS_CLIENT = RunService.IsClient();
		return IS_CLIENT ? clientAdapters : serverAdapters;
	};
}
