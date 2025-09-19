import { BloxStackAdapter, BloxStackScopeAdapter } from "../types";

export class AudioAdapterClient<Sounds> extends BloxStackScopeAdapter {
	public play(sound: Sounds) {
		print(sound);
	}
}
export class AudioAdapterServer<Sounds> extends BloxStackScopeAdapter {
	public play(player: Player, sound: Sounds) {
		print(sound);
	}
	public playAll(sound: Sounds) {
		print(sound);
	}
}

export interface AudioAdapterConfig {
	SoundEffects: { [key: string]: number };
}
export function audioAdapter<T extends Record<string, number>>(config: {
	SoundEffects: T;
}): BloxStackAdapter<"Audio", AudioAdapterClient<keyof T>, AudioAdapterServer<keyof T>> {
	return {
		name: "Audio",
		client: AudioAdapterClient,
		server: AudioAdapterServer,
	};
}
