import { MarketClient } from "./mod.ts";

export default (client: MarketClient) => ({
  latest: {
    bars: null,
    orderbook: null,
    quotes: null,
    trades: null,
  },

  historical: {
    bars: null,
    quotes: null,
    trades: null,
  },

  snapshots: null,
});
