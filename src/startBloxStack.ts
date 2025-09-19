import { RunService } from "@rbxts/services";
import { ArrayToRecord, BloxStack, BloxStackAdapter, BloxStackAdapters } from "./types";

export type Stack = "server" | "client";

interface BloxStackStartClientOptions {
	clientOnlyOption?: any;
}
interface BloxStackStartServerOptions {
	serverOnlyOption?: any;
}

export function startBloxStackClient<Adapters extends readonly BloxStackAdapter[]>(
	bloxstack: BloxStack<ArrayToRecord<Adapters>>,
	options: BloxStackStartClientOptions,
): ReturnType<BloxStack<ArrayToRecord<Adapters>>>["client"] {
	const isClient = RunService.IsClient();
	if (!isClient) error("Attempted to start client stack on server");
	return bloxstack()["client"];
}

export function startBloxStackServer<Adapters extends readonly BloxStackAdapter[]>(
	bloxstack: BloxStack<ArrayToRecord<Adapters>>,
	options: BloxStackStartServerOptions,
): ReturnType<BloxStack<ArrayToRecord<Adapters>>>["server"] {
	const isClient = RunService.IsClient();
	if (isClient) error("Attempted to start server stack on client");
	return bloxstack()["server"];
}
