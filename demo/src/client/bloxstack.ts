import { SharedBloxstack } from "shared/bloxstack";
import { startBloxStackClient } from "../../../src/startBloxStack";

export const ClientBloxstack = startBloxStackClient(SharedBloxstack, {
	clientOnlyOption: true,
});
