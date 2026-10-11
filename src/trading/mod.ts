import { Alpaca } from "../client.ts";
import tradingAccounts from "./accounts.ts";
import tradingInstruments from "./instruments.ts";
import tradingOrders from "./orders.ts";
import tradingPositions from "./position.ts";
import tradingWatchlists from "./watchlists.ts";
import { getCalendar, getClock } from "./calendar.ts";

const trading = (client: Alpaca) => {
  const { auth, paper } = client;
  return {
    account: tradingAccounts(auth, paper),
    instruments: tradingInstruments(auth, paper),
    orders: tradingOrders(auth, paper),
    positions: tradingPositions(auth, paper),
    watchlists: tradingWatchlists(auth, paper),

    calendar: client.bind(getCalendar),
    clock: client.bind(getClock),
  };
};

export type TradingClient = ReturnType<typeof trading>;
export default trading;
