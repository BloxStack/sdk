import { Object } from "@rbxts/luau-polyfill";
import { BloxStack, BloxStackAdapter, BloxStackAdapters, BloxStackScopeAdapter, BloxStackScopeAdapters } from "./types";
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
type ArrayToRecord<T extends readonly { name: string }[], K extends string = T[number]["name"]> = {
	[P in K]: Extract<T[number], { name: P }>;
};

export function createBloxStack<T extends BloxStackProperties>(props: T): BloxStack<ArrayToRecord<T["adapters"]>> {
	const clientAdapters: BloxStackScopeAdapters = {};
	const serverAdapters: BloxStackScopeAdapters = {};

	for (const adapter of props.adapters ?? []) {
		const { client, server, name } = adapter;
		clientAdapters[name] = client;
		serverAdapters[name] = server;
	}

	return () => ({
		client: clientAdapters as any,
		server: serverAdapters as any,
	});
}
