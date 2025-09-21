export class BloxStackScopeAdapter {}

export interface BloxStackAdapter<
	Name extends string = string,
	ClientType extends BloxStackScopeAdapter = BloxStackScopeAdapter,
	ServerType extends BloxStackScopeAdapter = BloxStackScopeAdapter,
> {
	name: Name;
	client: () => ClientType;
	server: () => ServerType;
}

export type BloxStack<Adapters extends BloxStackAdapters> = () => {
	client: { [K in keyof Adapters]: ReturnType<Adapters[K]["client"]> } & { init: () => void };
	server: { [K in keyof Adapters]: ReturnType<Adapters[K]["server"]> } & { init: () => void };
};

export type BloxStackAdapters<AdapterNames extends string = string> = {
	[K in AdapterNames]: BloxStackAdapter;
};

export type BloxStackScopeAdapters<AdapterNames extends string = string> = {
	[K in AdapterNames]: BloxStackScopeAdapter;
};

export type ArrayToRecord<T extends readonly BloxStackAdapter[]> = {
	[P in T[number]["name"]]: Extract<T[number], { name: P }>;
};
