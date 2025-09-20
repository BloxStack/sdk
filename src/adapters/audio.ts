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

export function audioAdapter<T extends Record<string, number>>(config: {
	SoundEffects: T;
}): BloxStackAdapter<"audio", AudioAdapterClient<keyof T>, AudioAdapterServer<keyof T>> {
	return {
		name: "audio",
		client: () => new AudioAdapterClient(),
		server: () => new AudioAdapterServer(),
	};
}
