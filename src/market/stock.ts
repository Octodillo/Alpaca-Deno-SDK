import { Z } from "../external.ts";
import { CurrencySchema } from "../trading/schemas.ts";
import { MarketClient } from "./mod.ts";
import {
  StockSymbol,
  StockQuery,
  StockQuerySchema,
  BarSchema,
  MultiStockQuery,
  MultiStockQuerySchema,
  QuoteSchema,
  TradeSchema,
  HistoricalQuery,
  HistoricalQuerySchema,
  AuctionStatsSchema,
  MultiHistoricalQuery,
  MultiHistoricalQuerySchema,
  StockSymbolSchema,
  StockSnapshotSchema,
  TickType,
  Tape,
  TapeSchema,
} from "./schema.ts";

const latest = (client: MarketClient) => ({
  bar: (symbol: StockSymbol, query: StockQuery) =>
    client.fetch({
      name: "Latest bar (single symbol)",
      endpoint: `v2/stocks/${symbol}/bars/latest`,
      method: "GET",

      querySchema: StockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: BarSchema,

      okStatus: 200,

      payload: { query },
    }),

  multiBar: (query: MultiStockQuery) =>
    client.fetch({
      name: "Latest Bars",
      endpoint: "v2/stocks/bars/latest",
      method: "GET",

      querySchema: MultiStockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        bars: BarSchema.array(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),

  quote: (symbol: StockSymbol, query: StockQuery) =>
    client.fetch({
      name: "Latest quote (single symbol)",
      endpoint: `v2/stocks/${symbol}/quotes/latest`,
      method: "GET",

      querySchema: StockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: QuoteSchema,

      okStatus: 200,

      payload: { query },
    }),

  multiQuote: (query: MultiStockQuery) =>
    client.fetch({
      name: "Latest quotes",
      endpoint: "v2/stocks/quotes/latest",
      method: "GET",

      querySchema: MultiStockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        quotes: QuoteSchema.array(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),

  trade: (symbol: StockSymbol, query: StockQuery) =>
    client.fetch({
      name: "Latest trade (single symbol)",
      endpoint: `v2/stocks/${symbol}/trades/latest`,
      method: "GET",

      querySchema: StockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: TradeSchema,

      okStatus: 200,

      payload: { query },
    }),

  multiTrade: (query: StockQuery) =>
    client.fetch({
      name: "Latest trades",
      endpoint: `v2/stocks/trades/latest`,
      method: "GET",

      querySchema: StockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        trades: TradeSchema.array(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),
});

const historical = (client: MarketClient) => ({
  auctions: (symbol: StockSymbol, query: HistoricalQuery) =>
    client.fetch({
      name: "Historical auctions (single symbol)",
      endpoint: `v2/stocks/${symbol}/auctions`,
      method: "GET",

      querySchema: HistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        auctions: AuctionStatsSchema.array(),
        currency: CurrencySchema,
        next_page_token: Z.string().nullable(),
      }),

      okStatus: 200,

      payload: { query },
    }),

  multiAuctions: (query: MultiHistoricalQuery) =>
    client.fetch({
      name: "Historical auctions",
      endpoint: "v2/stocks/auctions",
      method: "GET",

      querySchema: MultiHistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        auctions: Z.record(StockSymbolSchema, AuctionStatsSchema.array()),
        next_page_token: Z.string().nullable(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),

  bars: (symbol: StockSymbol, query: HistoricalQuery) =>
    client.fetch({
      name: "Historical bars (single symbol)",
      endpoint: `v2/stocks/${symbol}/bars`,
      method: "GET",

      querySchema: HistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        symbol: StockSymbolSchema,
        bars: BarSchema.array(),
        next_page_token: Z.string(),
      }),

      okStatus: 200,

      payload: { query },
    }),

  multiBars: (query: MultiHistoricalQuery) =>
    client.fetch({
      name: "Historical bars",
      endpoint: "v2/stocks/bars",
      method: "GET",

      querySchema: MultiHistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        bars: Z.record(StockSymbolSchema, BarSchema.array()),
        next_page_token: Z.string().nullable(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),

  quotes: (symbol: StockSymbol, query: HistoricalQuery) =>
    client.fetch({
      name: "Historical quotes (single symbol)",
      endpoint: `v2/stocks/${symbol}/quotes`,
      method: "GET",

      querySchema: HistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        symbol: StockSymbolSchema,
        quotes: QuoteSchema.array(),
        next_page_token: Z.string().nullable(),
        currency: CurrencySchema,
      }),
      okStatus: 200,
      payload: { query },
    }),

  multiQuotes: (query: MultiHistoricalQuery) =>
    client.fetch({
      name: "Historical quotes",
      endpoint: "v2/stocks/quotes",
      method: "GET",

      querySchema: MultiHistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        quotes: Z.record(StockSymbolSchema, QuoteSchema.array()),
        next_page_token: Z.string().nullable(),
        currency: CurrencySchema,
      }),
      okStatus: 200,
      payload: { query },
    }),

  trades: (symbol: StockSymbol, query: HistoricalQuery) =>
    client.fetch({
      name: "Historical trades (single symbol)",
      endpoint: `v2/stocks/${symbol}/trades`,
      method: "GET",

      querySchema: HistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        symbol: StockSymbolSchema,
        trades: TradeSchema.array(),
        next_page_token: Z.string().nullable(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),

  multiTrades: (query: MultiHistoricalQuery) =>
    client.fetch({
      name: "Historical trades",
      endpoint: "v2/stocks/trades",
      method: "GET",

      querySchema: MultiHistoricalQuerySchema,
      bodySchema: Z.never(),
      responseSchema: Z.object({
        trades: Z.record(StockSymbolSchema, TradeSchema.array()),
        next_page_token: Z.string().nullable(),
        currency: CurrencySchema,
      }),

      okStatus: 200,

      payload: { query },
    }),
});

export default (client: MarketClient) => ({
  latest: latest(client),
  historical: historical(client),

  snapshot: (symbol: StockSymbol, query: StockQuery) =>
    client.fetch({
      name: "Snapshot",
      endpoint: `v2/stocks/${symbol}/snapshot`,
      method: "GET",

      querySchema: StockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: StockSnapshotSchema,

      okStatus: 200,

      payload: { query },
    }),

  snapshots: (query: MultiStockQuery) =>
    client.fetch({
      name: "Snapshots",
      endpoint: "v2/stocks/snapshots",
      method: "GET",

      querySchema: MultiStockQuerySchema,
      bodySchema: Z.never(),
      responseSchema: StockSnapshotSchema.array(),

      okStatus: 200,

      payload: { query },
    }),

  conditionCodes: (tickType: TickType, tape: Tape) =>
    client.fetch({
      name: "Condition codes",
      endpoint: `v2/stocks/meta/conditions/${tickType}`,
      method: "GET",

      querySchema: Z.object({ tape: TapeSchema }),
      bodySchema: Z.never(),
      responseSchema: Z.record(Z.string().length(1), Z.string()),

      okStatus: 200,

      payload: { query: { tape } },
    }),

  exchangeCodes: () =>
    client.fetch({
      name: "Exchange codes",
      endpoint: "v2/stocks/meta/exchanges",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.record(Z.string().length(1), Z.string()),

      okStatus: 200,
    }),
});
