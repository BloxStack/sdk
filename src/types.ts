export interface BloxStackScopeAdapter {}
export interface BloxStackAdapter {
	/* this is a combination of both the client & server adapter used for packaging */
	client: BloxStackScopeAdapter;
	server: BloxStackScopeAdapter;
}
export type BloxStack = () => BloxStackScopeAdapter[];
