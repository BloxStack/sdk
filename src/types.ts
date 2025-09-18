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
export type BloxStackAdapters = Record<string, BloxStackAdapter>;
export type BloxStackScopeAdapters = Record<string, BloxStackScopeAdapter>;
