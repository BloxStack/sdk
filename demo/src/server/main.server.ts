import { ServerBloxstack } from "./bloxstack";
import { Players } from "@rbxts/services";

Players.PlayerAdded.Connect((player) => {
	ServerBloxstack.Audio.play(player, "OOF");
	ServerBloxstack.Audio.playAll("WELCOME_SOUND");
});

const audioAdapter = ServerBloxstack.Audio;

Players.PlayerRemoving.Connect((player) => {
	audioAdapter.playAll("GOODBYE_SOUND");
});

print("Server audio adapter initialized!");
print("Server adapter has methods: play(player, soundId), playAll(soundId)");
