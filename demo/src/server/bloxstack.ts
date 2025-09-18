import { SharedBloxstack } from "shared/bloxstack";
import { startBloxStackServer } from "../../../src/startBloxStack";

export const ClientBloxstack = startBloxStackServer(SharedBloxstack, {
	serverOnlyOption: true,
});
