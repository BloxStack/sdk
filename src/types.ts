export class BloxStackScopeAdapter {}
export interface BloxStackAdapter<Name extends string = string> {
	name: Name;
	client: BloxStackScopeAdapter;
	server: BloxStackScopeAdapter;
}

export type BloxStack<Adapters extends BloxStackAdapters> = () => {
	client: { [K in keyof Adapters]: Adapters[K]["client"] };
	server: { [K in keyof Adapters]: Adapters[K]["server"] };
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
