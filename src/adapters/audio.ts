import { BloxStackAdapter } from "../types";

export namespace AudioAdapterClient {
	export function play(soundId: string) {
		print(soundId);
	}
}
export namespace AudioAdapterServer {
	export function play(player: Player, soundId: string) {
		print(soundId);
	}
	export function playAll(soundId: string) {
		print(soundId);
	}
}

export interface AudioAdapterConfig {
	SoundEffects: Record<string, number>;
}
export function audioAdapter(config: AudioAdapterConfig): BloxStackAdapter {
	return {
		name: "Audio",
		client: () => {},
		server: () => {},
	};
}
