import { RunService } from "@rbxts/services";
import { BloxStack, BloxStackAdapters } from "./types";

export type Server = 0;
export type Client = 1;

interface BloxStackStartClientOptions {
	clientOnlyOption: any;
}
interface BloxStackStartServerOptions {
	serverOnlyOption: any;
}

type BloxStackStartOptions<T extends Server | Client> = T extends Server
	? BloxStackStartServerOptions
	: BloxStackStartClientOptions;

export default function startBloxStack<
	S extends Server | Client, // Explicit or inferred type for options
	T extends BloxStack<BloxStackAdapters> = BloxStack<BloxStackAdapters>, // T inferred from bloxstack
>(bloxstack: T, options: BloxStackStartOptions<S>): ReturnType<T>[S extends Server ? "server" : "client"] {
	const isClient = RunService.IsClient();
	return bloxstack()[isClient ? "client" : "server"];
}
