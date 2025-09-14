export type Server = Symbol;
export type Client = Symbol;

interface BloxStackStartClientOptions {
	clientOnlyOption: any;
}
interface BloxStackStartServerOptions {
	serverOnlyOption: any;
}

type BloxStackStartOptions<T extends Server | Client> = T extends Server
	? BloxStackStartServerOptions
	: BloxStackStartClientOptions;

export default function startBloxStack<T extends Server | Client>(options: BloxStackStartOptions<T>) {}
