import { createBloxStack } from "../../../src";
import { audioAdapter } from "../../../src/adapters/audio";

/** In shared */
const soundEffects = {
	OOF: 1,
	OOF2: 2,
};

export const SharedBloxstack = createBloxStack({
	debugMode: true,
	adapters: [
		audioAdapter({
			SoundEffects: soundEffects,
		}),
	] as const,
});
