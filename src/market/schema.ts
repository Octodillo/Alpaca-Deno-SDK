import { Z } from "../external.ts";
import { AlpacaDateTimeSchema, AlpacaDateSchema, CurrencySchema } from "../trading/schemas.ts";

export type TickType = Z.infer<typeof TickTypeSchema>;
export const TickTypeSchema = Z.enum(["trade", "quote"]);

export type Tape = Z.infer<typeof TapeSchema>;
export const TapeSchema = Z.enum(["A", "B", "C"]);

export const StockFeedSchema = Z.enum(["sip", "iex", "delayed_sip", "boats", "overnight", "otc"]);

export type StockSymbol = Z.infer<typeof StockSymbolSchema>;
export const StockSymbolSchema = Z.string().regex(/^[A-Z]{1,5}(\.[A-Z])?$/);
export const ExchangeCodeSchema = Z.enum(["A", "B", "C", "N", "O"]);
export const TradeUpdateSchema = Z.enum(["cancelled", "incorrect", "corrected"]).optional();

export type Bar = Z.infer<typeof BarSchema>;
export const BarSchema = Z.object({
  t: AlpacaDateTimeSchema,
  o: Z.number(),
  h: Z.number(),
  l: Z.number(),
  c: Z.number(),
  v: Z.int64(),
  n: Z.int64(),
  vw: Z.number(),
})
  .strict()
  .transform(bar => ({
    // opinionated
    timestamp: bar.t,
    openingPrice: bar.o,
    highPrice: bar.h,
    lowPrice: bar.l,
    closingPrice: bar.c,
    volume: bar.v,
    tradeCount: bar.n,
    vwaPrice: bar.vw,
  }));

export type Quote = Z.infer<typeof QuoteSchema>;
export const QuoteSchema = Z.object({
  t: AlpacaDateTimeSchema,
  bx: Z.string(), // TODO: See v2/stocks/meta/exchanges
  bp: Z.number(),
  bs: Z.uint32(),
  ax: Z.string(), // TODO: v2/stocks/meta/exchanges
  ap: Z.number(),
  as: Z.uint32(),
  c: Z.string().array(), // TODO: See v2/stocks/meta/conditions/quote
  z: ExchangeCodeSchema,
})
  .strict()
  .transform(quote => ({
    // opinionated
    timestamp: quote.t,
    bidExchange: quote.bx,
    bidPrice: quote.bp,
    bidSize: quote.bs,
    askExchange: quote.ax,
    askPrice: quote.ap,
    askSize: quote.as,
    conditionFlags: quote.c,
    exchangeCode: quote.z,
  }));

export type Trade = Z.infer<typeof TradeSchema>;
export const TradeSchema = Z.object({
  t: AlpacaDateTimeSchema,
  x: Z.string(), // TODO: See v2/stocks/meta/exchanges
  p: Z.number(),
  s: Z.uint32(),
  i: Z.uint64(),
  c: Z.string().array(), // TODO: See v2/stocks/meta/conditions/trade
  z: ExchangeCodeSchema,
  u: TradeUpdateSchema,
})
  .strict()
  .transform(trade => ({
    // opinionated
    timestamp: trade.t,
    exchange: trade.x,
    price: trade.p,
    size: trade.s,
    id: trade.i,
    conditionFlags: trade.c,
    exchangeCode: trade.z,
    update: trade.u,
  }));

export type Auction = Z.infer<typeof AuctionSchema>;
export const AuctionSchema = Z.object({
  t: AlpacaDateTimeSchema,
  x: Z.string(), // TODO: See v2/stocks/meta/exchanges
  p: Z.number(),
  s: Z.uint64(),
  c: Z.string(), // TODO: See v2/stocks/meta/conditions/auction
})
  .strict()
  .transform(auction => ({
    // opinionated
    timestamp: auction.t,
    exchange: auction.x,
    price: auction.p,
    size: auction.s,
    condition: auction.c,
  }));

export type AuctionStats = Z.infer<typeof AuctionStatsSchema>;
export const AuctionStatsSchema = Z.object({
  d: AlpacaDateSchema,
  o: AuctionSchema.array(),
  c: AuctionSchema.array(),
})
  .strict()
  .transform(auction => ({
    // opinionated
    date: auction.d,
    opening: auction.o,
    closing: auction.c,
  }));

export type StockSnapshot = Z.infer<typeof StockSnapshotSchema>;
export const StockSnapshotSchema = Z.object({
  symbol: StockSymbolSchema,
  currency: CurrencySchema,
  dailyBar: BarSchema,
  latestQuote: QuoteSchema,
  latestTrade: TradeSchema,
  minuteBar: BarSchema,
  prevDailyBar: BarSchema,
}).strict();

export type MultiStockQuery = Z.input<typeof MultiStockQuerySchema>;
export const MultiStockQuerySchema = Z.object({
  symbols: StockSymbolSchema.array().transform(arr => arr.join(",")),
  feed: StockFeedSchema.optional(),
  currency: CurrencySchema.optional(),
}).strict();

export type StockQuery = Z.input<typeof StockQuerySchema>;
export const StockQuerySchema = Z.object({
  feed: StockFeedSchema.optional(),
  currency: CurrencySchema.optional(),
}).strict();

export type HistoricalQuery = Z.input<typeof HistoricalQuerySchema>;
export const HistoricalQuerySchema = Z.object({
  start: AlpacaDateTimeSchema.optional(),
  end: AlpacaDateTimeSchema.optional(),
  limit: Z.int().min(1).max(10000).optional(),
  asof: AlpacaDateSchema.optional(), // TODO special case
  feed: StockFeedSchema.optional(), // TODO only sip is valid for auctions
  currency: CurrencySchema.optional(),
  page_token: Z.string().optional(),
  sort: Z.union([Z.literal("asc"), Z.literal("desc")]).optional(),
}).strict();

export type MultiHistoricalQuery = Z.input<typeof MultiHistoricalQuerySchema>;
export const MultiHistoricalQuerySchema = Z.object({
  symbols: StockSymbolSchema.array().transform(arr => arr.join(",")),
  start: AlpacaDateTimeSchema.optional(),
  end: AlpacaDateTimeSchema.optional(),
  limit: Z.int().min(1).max(10000).optional(),
  asof: AlpacaDateSchema.optional(), // TODO special case
  feed: StockFeedSchema.optional(), // TODO only sip is valid for auctions
  currency: CurrencySchema.optional(),
  page_token: Z.string().optional(),
  sort: Z.union([Z.literal("asc"), Z.literal("desc")]).optional(),
}).strict();
