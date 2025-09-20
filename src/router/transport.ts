import { InvalidateMessage, ServerInvalidationTarget } from "./types";

export interface RouterClientTransport {
	request<TOut>(pathKey: string, input: unknown): Promise<TOut>;
	onInvalidate(cb: (msg: InvalidateMessage) => void): () => void;
}

export interface RouterServerTransport {
	register(pathKey: string, handler: (player: Player, input: unknown) => Promise<unknown>): () => void;
	emitInvalidate(msg: InvalidateMessage, target: ServerInvalidationTarget): void;
}
