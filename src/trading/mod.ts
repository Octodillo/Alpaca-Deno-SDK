import { Z } from "../external.ts";
import { AlpacaAuth, endpoint } from "../mod.ts";
import tradingAccounts from "./accounts.ts";
import tradingInstruments from "./instruments.ts";
import tradingOrders from "./orders.ts";
import tradingPositions from "./position.ts";
import tradingWatchlists from "./watchlists.ts";
import { Calendar, CalendarQuery, CalendarQuerySchema, CalendarSchema, Clock, ClockSchema } from "./schemas.ts";

export const trading = (auth: AlpacaAuth, paper: boolean) => ({
  account: tradingAccounts(auth, paper),
  instruments: tradingInstruments(auth, paper),
  orders: tradingOrders(auth, paper),
  positions: tradingPositions(auth, paper),
  watchlists: tradingWatchlists(auth, paper),

  calendar: (query: CalendarQuery): Promise<Calendar> =>
    endpoint({
      name: "Get Market Calendar",
      endpoint: "v2/calendar",
      method: "GET",
      api: paper ? "paper-api" : "live",
      auth,

      querySchema: CalendarQuerySchema,
      bodySchema: Z.never(),
      responseSchema: CalendarSchema,

      okStatus: 200,

      payload: { query },
    }),

  clock: (): Promise<Clock> =>
    endpoint({
      name: "Get Market Clock",
      endpoint: "v2/clock",
      method: "GET",
      api: paper ? "paper-api" : "live",
      auth,

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: ClockSchema,

      okStatus: 200,

      payload: {},
    }),
});
