import { Object } from "@rbxts/luau-polyfill";
import { BloxStack, BloxStackAdapter, BloxStackScopeAdapter } from "./types";
import { RunService } from "@rbxts/services";

/* Input */
interface BloxStackProperties {
	debugMode?: boolean;
	adapters: BloxStackAdapter[];
}

/**
 * Entry point function which returns a new BloxStack
 * @param props
 */
export function createBloxStack<T extends BloxStackProperties>(props: T): BloxStack<T["adapters"]> {
	const clientAdapters: BloxStackScopeAdapter[] = [];
	const serverAdapters: BloxStackScopeAdapter[] = [];

	for (const adapter of props.adapters ?? []) {
		const { client, server } = adapter;
		clientAdapters.push(client);
		serverAdapters.push(server);
	}

	return () => {
		const IS_CLIENT = RunService.IsClient();
		return IS_CLIENT ? clientAdapters : serverAdapters;
	};
}
