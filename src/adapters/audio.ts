import { BloxStackAdapter } from "../types";

export class AudioAdapterClient {
	public play(soundId: string) {
		print(soundId);
	}
}
export class AudioAdapterServer {
	public play(player: Player, soundId: string) {
		print(soundId);
	}
	public playAll(soundId: string) {
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
