import { BloxStackAdapter, BloxStackScopeAdapter } from "../types";

export class AudioAdapterClient extends BloxStackScopeAdapter {
	public play(soundId: string) {
		print(soundId);
	}
}
export class AudioAdapterServer extends BloxStackScopeAdapter {
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
export function audioAdapter(config: AudioAdapterConfig): BloxStackAdapter<"Audio"> {
	return {
		name: "Audio" as const,
		client: AudioAdapterClient,
		server: AudioAdapterServer,
	};
}
