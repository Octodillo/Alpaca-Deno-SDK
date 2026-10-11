import { alpaca } from "../src/mod.ts";

export const altesta = alpaca({ paper: true });

altesta.trading.calendar({ query: {} });
