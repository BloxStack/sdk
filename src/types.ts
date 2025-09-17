export interface BloxStackScopeAdapter {}
export interface BloxStackAdapter {
	/* this is a combination of both the client & server adapter used for packaging */
	name: string;
	client: BloxStackScopeAdapter;
	server: BloxStackScopeAdapter;
}
export type BloxStack<Adapters extends BloxStackAdapter[]> = () => {
	client: { [K in keyof Adapters]: Adapters[K]["client"] };
	server: { [K in keyof Adapters]: Adapters[K]["server"] };
};
