import { BloxStackAdapter } from "../types";

export interface AudioAdapterConfig {
	SoundEffects: Record<string, number>;
}

export function audioAdapter(config: AudioAdapterConfig): BloxStackAdapter {
	return {
		client: () => {},
		server: () => {},
	};
}
