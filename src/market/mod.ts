import type { Z } from "../external.ts";
import type { Endpoint } from "../client.ts";
import * as M from "../generated/market/endpoints.ts";
import type { CryptoHistoricalLoc, CryptoLatestLoc, MarketType } from "../generated/market/schemas.ts";

type Query<E extends Endpoint> = Z.input<E["query"]>;

export const marketEndpoints = {
  stock: {
    latest: {
      bar: {
        ...M.stockLatestBarSingle,
        args: (symbol: string, query?: Query<typeof M.stockLatestBarSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiBar: M.stockLatestBars,
      quote: {
        ...M.stockLatestQuoteSingle,
        args: (symbol: string, query?: Query<typeof M.stockLatestQuoteSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiQuote: M.stockLatestQuotes,
      trade: {
        ...M.stockLatestTradeSingle,
        args: (symbol: string, query?: Query<typeof M.stockLatestTradeSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiTrade: M.stockLatestTrades,
    },
    historical: {
      auctions: {
        ...M.stockAuctionSingle,
        args: (symbol: string, query?: Query<typeof M.stockAuctionSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiAuctions: M.stockAuctions,
      bars: {
        ...M.stockBarSingle,
        args: (symbol: string, query: Query<typeof M.stockBarSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiBars: M.stockBars,
      quotes: {
        ...M.stockQuoteSingle,
        args: (symbol: string, query?: Query<typeof M.stockQuoteSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiQuotes: M.stockQuotes,
      trades: {
        ...M.stockTradeSingle,
        args: (symbol: string, query?: Query<typeof M.stockTradeSingle>) => ({ params: { symbol }, query }),
      } satisfies Endpoint,
      multiTrades: M.stockTrades,
    },
    snapshot: {
      ...M.stockSnapshotSingle,
      args: (symbol: string, query?: Query<typeof M.stockSnapshotSingle>) => ({ params: { symbol }, query }),
    } satisfies Endpoint,
    snapshots: M.stockSnapshots,
    conditionCodes: {
      ...M.stockMetaConditions,
      args: (ticktype: "trade" | "quote", tape: Query<typeof M.stockMetaConditions>["tape"]) => ({
        params: { ticktype },
        query: { tape },
      }),
    } satisfies Endpoint,
    exchangeCodes: M.stockMetaExchanges,
  },

  // `loc` defaults to "us", Alpaca's only crypto location
  crypto: {
    latest: {
      bars: {
        ...M.cryptoLatestBars,
        args: (query: Query<typeof M.cryptoLatestBars>, loc: CryptoLatestLoc = "us") => ({ params: { loc }, query }),
      } satisfies Endpoint,
      orderbooks: {
        ...M.cryptoLatestOrderbooks,
        args: (query: Query<typeof M.cryptoLatestOrderbooks>, loc: CryptoLatestLoc = "us") => ({
          params: { loc },
          query,
        }),
      } satisfies Endpoint,
      quotes: {
        ...M.cryptoLatestQuotes,
        args: (query: Query<typeof M.cryptoLatestQuotes>, loc: CryptoLatestLoc = "us") => ({ params: { loc }, query }),
      } satisfies Endpoint,
      trades: {
        ...M.cryptoLatestTrades,
        args: (query: Query<typeof M.cryptoLatestTrades>, loc: CryptoLatestLoc = "us") => ({ params: { loc }, query }),
      } satisfies Endpoint,
    },
    historical: {
      bars: {
        ...M.cryptoBars,
        args: (query: Query<typeof M.cryptoBars>, loc: CryptoHistoricalLoc = "us") => ({ params: { loc }, query }),
      } satisfies Endpoint,
      quotes: {
        ...M.cryptoQuotes,
        args: (query: Query<typeof M.cryptoQuotes>, loc: CryptoHistoricalLoc = "us") => ({ params: { loc }, query }),
      } satisfies Endpoint,
      trades: {
        ...M.cryptoTrades,
        args: (query: Query<typeof M.cryptoTrades>, loc: CryptoHistoricalLoc = "us") => ({ params: { loc }, query }),
      } satisfies Endpoint,
    },
    snapshots: {
      ...M.cryptoSnapshots,
      args: (query: Query<typeof M.cryptoSnapshots>, loc: CryptoLatestLoc = "us") => ({ params: { loc }, query }),
    } satisfies Endpoint,
  },

  option: {
    latest: {
      quotes: M.optionLatestQuotes,
      trades: M.optionLatestTrades,
    },
    historical: {
      bars: M.optionBars,
      trades: M.optionTrades,
    },
    snapshots: M.optionSnapshots,
    chain: {
      ...M.optionChain,
      args: (underlying_symbol: string, query?: Query<typeof M.optionChain>) => ({
        params: { underlying_symbol },
        query,
      }),
    } satisfies Endpoint,
    conditionCodes: {
      ...M.optionMetaConditions,
      args: (ticktype: "trade" | "quote") => ({ params: { ticktype } }),
    } satisfies Endpoint,
    exchangeCodes: M.optionMetaExchanges,
  },

  forex: {
    latestRates: M.latestRates,
    rates: M.rates,
  },

  news: M.news,

  screener: {
    movers: {
      ...M.movers,
      args: (market_type: MarketType, query?: Query<typeof M.movers>) => ({ params: { market_type }, query }),
    } satisfies Endpoint,
    mostActives: M.mostActives,
  },

  corporateActions: M.corporateActions,

  fixedIncome: {
    latestPrices: M.fixedIncomeLatestPrices,
    latestQuotes: M.fixedIncomeLatestQuotes,
  },
};
