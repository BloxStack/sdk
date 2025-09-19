import { SharedBloxstack } from "shared/bloxstack";
import { startBloxStackServer } from "../../../src/startBloxStack";

export const ServerBloxstack = startBloxStackServer(SharedBloxstack, {
	serverOnlyOption: true,
});
