import { SharedBloxstack } from "shared/bloxstack";
import startBloxStack, { Client, Server } from "../../../src/startBloxStack";

export const ClientBloxstack = startBloxStack<Client>(SharedBloxstack, {
	clientOnlyOption: true,
});
