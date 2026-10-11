// Live market data tests with the paper keys in `.env` (free tier: IEX feed, 200 requests/min).
// Subscription-gated endpoints pass when they fail with a 403 AlpacaError.
import { assert, assertEquals, assertRejects } from "@std/assert";
import { AlpacaError } from "../src/client.ts";
import { auth, live } from "./common.ts";

const m = live.market;
const liveTest = (name: string, fn: () => Promise<void>) => Deno.test({ name: `live: ${name}`, ignore: !auth, fn });

const assertForbidden = async (call: () => Promise<unknown>) => {
  const error = await assertRejects(call, AlpacaError);
  assertEquals(error.status, 403);
  console.log(`  subscription-gated: ${error.message}`);
};

const iex = { feed: "iex" } as const;
// A full past session, so results don't depend on today's market hours
const session = { start: "2026-10-09T13:30:00Z", end: "2026-10-09T20:00:00Z", limit: 1 };
const option = "AAPL261120C00250000";

liveTest("stock.latest", async () => {
  assertEquals((await m.stock.latest.bar("AAPL", iex)).symbol, "AAPL");
  assert((await m.stock.latest.multiBar({ query: { symbols: "AAPL,MSFT", ...iex } })).bars.MSFT);
  assertEquals((await m.stock.latest.quote("AAPL", iex)).symbol, "AAPL");
  assert((await m.stock.latest.multiQuote({ query: { symbols: "AAPL", ...iex } })).quotes.AAPL);
  assertEquals((await m.stock.latest.trade("AAPL", iex)).symbol, "AAPL");
  assert((await m.stock.latest.multiTrade({ query: { symbols: "AAPL", ...iex } })).trades.AAPL);
});

liveTest("stock.historical", async () => {
  assertEquals((await m.stock.historical.bars("AAPL", { timeframe: "1Hour", ...iex, ...session })).bars.length, 1);
  const bars = await m.stock.historical.multiBars({
    query: { symbols: "AAPL", timeframe: "1Hour", ...iex, ...session },
  });
  assertEquals(bars.bars.AAPL.length, 1);
  assertEquals((await m.stock.historical.quotes("AAPL", { ...iex, ...session })).quotes.length, 1);
  assert((await m.stock.historical.multiQuotes({ query: { symbols: "AAPL", ...iex, ...session } })).quotes.AAPL);
  assertEquals((await m.stock.historical.trades("AAPL", { ...iex, ...session })).trades.length, 1);
  assert((await m.stock.historical.multiTrades({ query: { symbols: "AAPL", ...iex, ...session } })).trades.AAPL);
  const auctions = await m.stock.historical.auctions("AAPL", { start: "2026-10-09", end: "2026-10-09", limit: 2 });
  assertEquals(auctions.auctions[0].d, "2026-10-09");
  const multi = await m.stock.historical.multiAuctions({ query: { symbols: "AAPL", start: "2026-10-09", limit: 2 } });
  assert(multi.auctions.AAPL);
});

liveTest("stock.snapshot, snapshots, codes", async () => {
  assertEquals((await m.stock.snapshot("AAPL", iex)).symbol, "AAPL");
  assert((await m.stock.snapshots({ query: { symbols: "AAPL,MSFT", ...iex } })).MSFT);
  assert(Object.keys(await m.stock.conditionCodes("trade", "A")).length > 0);
  assert(Object.keys(await m.stock.exchangeCodes()).length > 0);
});

liveTest("stock SIP (subscription-gated)", async () => {
  await assertForbidden(() => m.stock.latest.bar("AAPL", { feed: "sip" }));
});

liveTest("crypto", async () => {
  const symbols = "BTC/USD";
  assert((await m.crypto.latest.bars({ symbols })).bars[symbols]);
  assert((await m.crypto.latest.orderbooks({ symbols })).orderbooks[symbols]);
  assert((await m.crypto.latest.quotes({ symbols })).quotes[symbols]);
  assert((await m.crypto.latest.trades({ symbols })).trades[symbols]);
  assertEquals((await m.crypto.historical.bars({ symbols, timeframe: "1Hour", ...session })).bars[symbols].length, 1);
  assertEquals((await m.crypto.historical.quotes({ symbols, ...session })).quotes[symbols].length, 1);
  assertEquals((await m.crypto.historical.trades({ symbols, ...session })).trades[symbols].length, 1);
  assert((await m.crypto.snapshots({ symbols })).snapshots[symbols]);
});

liveTest("option (indicative feed)", async () => {
  assert((await m.option.latest.quotes({ query: { symbols: option } })).quotes[option]);
  assert((await m.option.latest.trades({ query: { symbols: option } })).trades);
  assert((await m.option.historical.bars({ query: { symbols: option, timeframe: "1Day", limit: 1 } })).bars);
  assert((await m.option.historical.trades({ query: { symbols: option, limit: 1 } })).trades);
  assert((await m.option.snapshots({ query: { symbols: option } })).snapshots);
  assert((await m.option.chain("AAPL", { limit: 1 })).snapshots);
  assert(Object.keys(await m.option.conditionCodes("trade")).length > 0);
  assert(Object.keys(await m.option.exchangeCodes()).length > 0);
});

liveTest("news", async () => {
  assert((await m.news({ query: { symbols: "AAPL", limit: 1 } })).news.length <= 1);
});

liveTest("screener", async () => {
  assertEquals((await m.screener.movers("stocks", { top: 1 })).gainers.length, 1);
  assertEquals((await m.screener.mostActives({ query: { top: 1 } })).most_actives.length, 1);
});

liveTest("corporateActions", async () => {
  const { corporate_actions } = await m.corporateActions({ query: { symbols: "AAPL", start: "2026-07-01", limit: 1 } });
  assert(corporate_actions);
});

liveTest("forex (subscription-gated)", async () => {
  await assertForbidden(() => m.forex.latestRates({ query: { currency_pairs: "USDJPY" } }));
  await assertForbidden(() => m.forex.rates({ query: { currency_pairs: "USDJPY", limit: 1 } }));
});

liveTest("fixedIncome (subscription-gated)", async () => {
  await assertForbidden(() => m.fixedIncome.latestPrices({ query: { isins: "US912797LN03" } }));
  await assertForbidden(() => m.fixedIncome.latestQuotes({ query: { isins: "US912797LN03" } }));
});
