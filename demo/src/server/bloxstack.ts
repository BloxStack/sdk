import { SharedBloxstack } from "shared/bloxstack";
import startBloxStack, { Client, Server } from "../../../src/startBloxStack";

export default startBloxStack<Server>(SharedBloxstack, {
	serverOnlyOption: true,
});
