import { ArrayToRecord, BloxStack, BloxStackAdapter, BloxStackScopeAdapter, BloxStackScopeAdapters } from "./types";

/**
 * Entry point function which returns a new BloxStack
 * @param props
 */

export function createBloxStack<const T extends readonly BloxStackAdapter[]>(props: {
	adapters: T;
	debugMode?: boolean;
}): BloxStack<ArrayToRecord<T>> {
	const clientAdapters = {} as { [K in T[number]["name"]]: ReturnType<T[number]["client"]> };
	const serverAdapters = {} as { [K in T[number]["name"]]: ReturnType<T[number]["server"]> };

	for (const adapter of props.adapters) {
		const name = adapter.name as keyof typeof clientAdapters;
		clientAdapters[name] = adapter.client() as any;
		serverAdapters[name] = adapter.server() as any;
	}

	return () => ({
		client: clientAdapters,
		server: serverAdapters,
	});
}
