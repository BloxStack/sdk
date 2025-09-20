import { RunService } from "@rbxts/services";
import { RouterClientTransport, RouterServerTransport } from "./transport";

/**
 * Base adapter contract for router transports. Other packages (e.g. Flamework networking,
 * RemoteEvent/RemoteFunction, Net, etc.) implement this interface and provide concrete
 * client/server transports.
 */
export interface RouterAdapter {
	client(): RouterClientTransport;
	server(): RouterServerTransport;
}

/**
 * Helper that resolves the appropriate side's transport from a shared adapter using RunService.
 */
export function resolveTransport(adapter: RouterAdapter): RouterClientTransport | RouterServerTransport {
	const isClient = RunService.IsClient();
	return isClient ? adapter.client() : adapter.server();
}
