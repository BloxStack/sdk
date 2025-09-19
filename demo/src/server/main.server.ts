import { ServerBloxstack } from "./bloxstack";
import { Players } from "@rbxts/services";

Players.PlayerAdded.Connect((player) => {
	ServerBloxstack.Audio.play(player, "OOF");
});
