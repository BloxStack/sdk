import { ReplicatedStorage, Players } from "@rbxts/services";
import { RouterAdapter } from "../adapter";
import { InvalidateMessage } from "../types";

interface RpcRequest {
	pathKey: string;
	input?: unknown;
}

type RpcResponse =
	| { ok: true; data: unknown }
	| { ok: false; error: { code: "BAD_REQUEST" | "INTERNAL" | "NOT_FOUND"; message: string } };

export interface RemotesRouterAdapterConfig {
	/** Parent container under ReplicatedStorage for created remotes. Default: ReplicatedStorage */
	parent?: Instance;
	/** Namespace for naming the remotes. Default: "bloxstack" */
	namespace?: string;
	/** Optional serializer hooks for payloads */
	serializer?: {
		encodeRequest: (req: RpcRequest) => unknown;
		decodeRequest: (payload: unknown) => RpcRequest;
		encodeResponse: (res: RpcResponse) => unknown;
		decodeResponse: (payload: unknown) => RpcResponse;
		encodeInvalidate: (msg: InvalidateMessage) => unknown;
		decodeInvalidate: (payload: unknown) => InvalidateMessage;
	};
}

function ensureRemotes(config: RemotesRouterAdapterConfig) {
	const parent = (config.parent ?? ReplicatedStorage) as Instance;
	const ns = config.namespace ?? "bloxstack";
	const folderName = `${ns}:router`;
	let folder = parent.FindFirstChild(folderName) as Folder | undefined;
	if (!folder) {
		folder = new Instance("Folder");
		folder.Name = folderName;
		folder.Parent = parent;
	}
	const rpcName = `${ns}:rpc`;
	const invName = `${ns}:invalidate`;

	let rf = folder.FindFirstChild(rpcName) as RemoteFunction | undefined;
	if (!rf) {
		rf = new Instance("RemoteFunction");
		rf.Name = rpcName;
		rf.Parent = folder;
	}
	let ev = folder.FindFirstChild(invName) as RemoteEvent | undefined;
	if (!ev) {
		ev = new Instance("RemoteEvent");
		ev.Name = invName;
		ev.Parent = folder;
	}
	return { rf, ev };
}

export function remotesRouterAdapter(config: RemotesRouterAdapterConfig = {}): RouterAdapter {
	const ns = config.namespace ?? "bloxstack";
	const rpcName = `${ns}:router/${ns}:rpc`;
	const invName = `${ns}:router/${ns}:invalidate`;

	return {
		client() {
			const parent = (config.parent ?? ReplicatedStorage) as Instance;
			const [folderName, rpcSimple] = rpcName.find!("/")
				? (rpcName.split("/") as defined as [string, string])
				: ["", rpcName];
			const [_, invSimple] = invName.find!("/")
				? (invName.split("/") as defined as [string, string])
				: ["", invName];
			const folder = (folderName !== "" ? (parent.WaitForChild(folderName) as Folder) : parent) as Instance;
			const rf = folder.WaitForChild(rpcSimple) as RemoteFunction;
			const ev = folder.WaitForChild(invSimple) as RemoteEvent;

			return {
				async request<TOut>(pathKey: string, input: unknown): Promise<TOut> {
					const req: RpcRequest = { pathKey, input };
					const payload = config.serializer ? config.serializer.encodeRequest(req) : (req as unknown);
					const raw = rf.InvokeServer(payload) as unknown;
					const res = (
						config.serializer ? config.serializer.decodeResponse(raw) : (raw as RpcResponse)
					) as RpcResponse;
					if (res.ok) return res.data as TOut;
					throw `Router error (${res.error.code}): ${res.error.message}`;
				},
				onInvalidate(cb) {
					const conn = ev.OnClientEvent.Connect((raw) => {
						const msg = (
							config.serializer ? config.serializer.decodeInvalidate(raw) : (raw as InvalidateMessage)
						) as InvalidateMessage;
						cb(msg);
					});
					return () => conn.Disconnect();
				},
			};
		},

		server() {
			const { rf, ev } = ensureRemotes(config);
			const handlers = new Map<string, (player: Player, input: unknown) => Promise<unknown>>();

			rf.OnServerInvoke = (player: Player, raw: unknown) => {
				const req = (
					config.serializer ? config.serializer.decodeRequest(raw) : (raw as RpcRequest)
				) as RpcRequest;
				const fn = handlers.get(req.pathKey);
				if (!fn) {
					const res: RpcResponse = { ok: false, error: { code: "NOT_FOUND", message: req.pathKey } };
					return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
				}
				try {
					const promise = fn(player, req.input);
					const result = (Promise.is(promise) ? promise : Promise.resolve(promise)) as Promise<unknown>;
					const [success, value] = pcall(() => result.await());
					if (success) {
						const res: RpcResponse = { ok: true, data: value };
						return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
					} else {
						const res: RpcResponse = { ok: false, error: { code: "INTERNAL", message: tostring(value) } };
						return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
					}
				} catch (e) {
					const res: RpcResponse = { ok: false, error: { code: "INTERNAL", message: tostring(e) } };
					return config.serializer ? config.serializer.encodeResponse(res) : (res as unknown);
				}
			};

			return {
				register(pathKey, handler) {
					handlers.set(pathKey, handler);
					return () => handlers.delete(pathKey);
				},
				emitInvalidate(msg, target) {
					const payload = config.serializer ? config.serializer.encodeInvalidate(msg) : (msg as unknown);
					if (target.scope === "all") {
						ev.FireAllClients(payload);
						return;
					}
					if (target.scope === "player" && target.player) {
						ev.FireClient(target.player, payload);
						return;
					}
					if (target.scope === "players" && target.players) {
						for (const p of target.players as Player[]) ev.FireClient(p, payload);
						return;
					}
				},
			};
		},
	};
}
