import { Networking } from "@flamework/networking";
import { RouterAdapter } from "../adapter";
import { InvalidateMessage } from "../types";

interface RpcRequest {
	pathKey: string;
	input?: unknown;
}

type RpcResponse =
	| { ok: true; data: unknown }
	| { ok: false; error: { code: "BAD_REQUEST" | "INTERNAL" | "NOT_FOUND"; message: string } };

export interface FlameworkRouterAdapterConfig {
	namespace?: string; // defaults to "bloxstack"
	unreliableInvalidation?: boolean; // defaults to true
	serializer?: {
		encodeRequest: (req: RpcRequest) => unknown;
		decodeRequest: (payload: unknown) => RpcRequest;
		encodeResponse: (res: RpcResponse) => unknown;
		decodeResponse: (payload: unknown) => RpcResponse;
		encodeInvalidate: (msg: InvalidateMessage) => unknown;
		decodeInvalidate: (payload: unknown) => InvalidateMessage;
	};
}

function getNames(config: FlameworkRouterAdapterConfig) {
	const ns = config.namespace ?? "bloxstack";
	return {
		rpc: `${ns}:rpc`,
		invalidate: `${ns}:invalidate`,
	};
}

export function flameworkRouterAdapter(config: FlameworkRouterAdapterConfig = {}): RouterAdapter {
	const names = getNames(config);

	// Flamework's createFunction/createEvent expect an intrinsic declaration token; we pass undefined to
	// use the generated id and avoid a hard string here.
	const rpc = Networking.createFunction<{ request(req: unknown): unknown }, {}>(undefined as unknown as never);
	const invalidate = Networking.createEvent<{}, { invalidate(msg: unknown): void }>(undefined as unknown as never);

	return {
		client() {
			const rpcClient = rpc.createClient({}, {} as never);
			const invClient = invalidate.createClient({}, {} as never);

			return {
				async request<TOut>(pathKey: string, input: unknown): Promise<TOut> {
					const req: RpcRequest = { pathKey, input };
					const payload = config.serializer ? config.serializer.encodeRequest(req) : (req as unknown);
					const raw = (await rpcClient.request.invoke(payload)) as unknown;
					const res = (
						config.serializer ? config.serializer.decodeResponse(raw) : (raw as RpcResponse)
					) as RpcResponse;
					if (res.ok) return res.data as TOut;
					throw `Router error (${res.error.code}): ${res.error.message}`;
				},
				onInvalidate(cb) {
					const connection = invClient.invalidate.connect((raw) => {
						const msg = (
							config.serializer ? config.serializer.decodeInvalidate(raw) : (raw as InvalidateMessage)
						) as InvalidateMessage;
						cb(msg);
					});
					return () => connection.Disconnect();
				},
			};
		},

		server() {
			const rpcServer = rpc.createServer({}, {} as never);
			const invServer = invalidate.createServer({}, {} as never);

			const handlers = new Map<string, (player: Player, input: unknown) => Promise<unknown>>();
			let callbackBound = false;

			return {
				register(pathKey, handler) {
					handlers.set(pathKey, handler);
					if (!callbackBound) {
						rpcServer.request.setCallback(async (player, raw) => {
							const req = (
								config.serializer ? config.serializer.decodeRequest(raw) : (raw as RpcRequest)
							) as RpcRequest;
							const fn = handlers.get(req.pathKey);
							if (!fn) {
								const res: RpcResponse = {
									ok: false,
									error: { code: "NOT_FOUND", message: req.pathKey },
								};
								return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
							}
							try {
								const data = await fn(player, req.input);
								const res: RpcResponse = { ok: true, data };
								return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
							} catch (e) {
								const res: RpcResponse = {
									ok: false,
									error: { code: "INTERNAL", message: tostring(e) },
								};
								return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
							}
						});
						callbackBound = true;
					}
					return () => handlers.delete(pathKey);
				},
				emitInvalidate(msg, target) {
					const payload = config.serializer ? config.serializer.encodeInvalidate(msg) : (msg as unknown);
					if (target.scope === "all") {
						invServer.invalidate.broadcast(payload);
						return;
					}
					if (target.scope === "player") {
						if (target.player) invServer.invalidate.fire(target.player, payload);
						return;
					}
					if (target.scope === "players") {
						if (target.players) invServer.invalidate.fire(target.players, payload);
						return;
					}
				},
			};
		},
	};
}
