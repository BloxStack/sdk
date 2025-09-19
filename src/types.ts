export class BloxStackScopeAdapter {}

export interface BloxStackAdapter<
	Name extends string = string,
	ClientType extends BloxStackScopeAdapter = BloxStackScopeAdapter,
	ServerType extends BloxStackScopeAdapter = BloxStackScopeAdapter,
> {
	name: Name;
	client: new () => ClientType;
	server: new () => ServerType;
}

export type BloxStack<Adapters extends BloxStackAdapters> = () => {
	client: { [K in keyof Adapters]: InstanceType<Adapters[K]["client"]> };
	server: { [K in keyof Adapters]: InstanceType<Adapters[K]["server"]> };
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
