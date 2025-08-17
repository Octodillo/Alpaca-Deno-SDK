import { AlpacaClient } from "../client.ts";
import { Z } from "../external.ts";
import TradingAccountModule from "./accounts.ts";
import TradingInstrumentsModule from "./instruments.ts";
import TradingOrdersModule from "./orders.ts";
import TradingPositionsModule from "./position.ts";
import { CalendarQuery, Calendar, CalendarQuerySchema, CalendarSchema, Clock, ClockSchema } from "./schemas.ts";
import TradingWatchlistsModule from "./watchlists.ts";

export default class TradingClient extends AlpacaClient {
  protected override baseAPI = this.alpaca.config.paper ? "paper-api" : "live";

  public readonly account = TradingAccountModule(this);
  public readonly instruments = TradingInstrumentsModule(this);
  public readonly orders = TradingOrdersModule(this);
  public readonly positions = TradingPositionsModule(this);
  public readonly watchlists = TradingWatchlistsModule(this);

  public calendar(query: CalendarQuery = {}): Promise<Calendar> {
    return this.fetch({
      name: "Get Market Calendar",
      endpoint: "v2/calendar",
      method: "GET",

      querySchema: CalendarQuerySchema,
      bodySchema: Z.never(),
      responseSchema: CalendarSchema,

      okStatus: 200,

      payload: { query },
    });
  }

  public clock(): Promise<Clock> {
    return this.fetch({
      name: "Get Market Clock",
      endpoint: "v2/clock",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: ClockSchema,

      okStatus: 200,
    });
  }
}
