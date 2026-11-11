// Live tests against the paper account in `.env`. Read-only by default; the mutating ones only run
// with ALPACA_MUTATING_TESTS=1 and clean up after themselves.
import { assert, assertEquals, assertInstanceOf, assertRejects } from "@std/assert";
import { Alpaca, AlpacaError } from "../src/client.ts";
import { auth, json, live, mutating, withStubbedFetch } from "./common.ts";

const t = live.trading;
const liveTest = (name: string, fn: () => Promise<void>) => Deno.test({ name: `live: ${name}`, ignore: !auth, fn });
const mutatingTest = (name: string, fn: () => Promise<void>) =>
  Deno.test({ name: `mutating: ${name}`, ignore: !auth || !mutating, fn });

/** Endpoints Alpaca doesn't serve on paper: the call must still reach the API and fail cleanly. */
const assertUnavailableOnPaper = async (call: () => Promise<unknown>) => {
  const error = await assertRejects(call, AlpacaError);
  assertEquals(error.status, 404);
  console.log(`  unavailable on paper: ${error.message}`);
};

liveTest("account.get", async () => {
  const account = await t.account.get();
  assertEquals(typeof account.id, "string");
  assertEquals(typeof account.effective_buying_power, "string");
});

liveTest("account.history", async () => {
  const history = await t.account.history({ query: { period: "1W", timeframe: "1D" } });
  assertEquals(history.timestamp?.length, history.equity?.length);
});

liveTest("account.configs", async () => {
  const configs = await t.account.configs();
  assert(configs.dtbp_check === undefined || ["both", "entry", "exit"].includes(configs.dtbp_check));
});

liveTest("account.activities", async () => {
  const activities = await t.account.activities({ query: { page_size: 1 } });
  assert(activities.length <= 1);
});

liveTest("account.activities: plain dates as filters", async () => {
  assert(Array.isArray(await t.account.activities({ query: { date: "2026-10-09" } })));
  const range = { after: "2026-10-01", until: "2026-10-09T20:00:00Z", page_size: 1 };
  assert(Array.isArray(await t.account.activities({ query: range })));
  assert(Array.isArray(await t.account.activitiesByType("FILL", range)));
});

liveTest("account.activitiesByType", async () => {
  const fills = await t.account.activitiesByType("FILL");
  assert(Array.isArray(fills));
});

liveTest("orders.search, get, getByClientID", async () => {
  const orders = await t.orders.search({ query: { status: "all", limit: 1 } });
  assert(orders.length <= 1);
  if (!orders[0]) return console.log("  no orders on the account: get and getByClientID untested");
  assertEquals((await t.orders.get(orders[0].id, true)).id, orders[0].id);
  assertEquals((await t.orders.getByClientID(orders[0].client_order_id!)).id, orders[0].id);
});

liveTest("positions.all, get", async () => {
  const positions = await t.positions.all();
  if (!positions[0]) return console.log("  no open positions: positions.get untested");
  assertEquals((await t.positions.get(positions[0].symbol)).symbol, positions[0].symbol);
});

liveTest("watchlists.all, getByID, getByName", async () => {
  const lists = await t.watchlists.all();
  if (!lists[0]) return console.log("  no watchlists: getByID and getByName untested (the mutating test covers them)");
  assertEquals((await t.watchlists.getByID(lists[0].id)).id, lists[0].id);
  assertEquals((await t.watchlists.getByName(lists[0].name)).id, lists[0].id);
});

liveTest("assets.all, get", async () => {
  const crypto = await t.assets.all({ query: { asset_class: "crypto", status: "active" } });
  assert(crypto.some((asset) => asset.symbol === "BTC/USD"));
  const apple = await t.assets.get("AAPL");
  assertEquals(apple.symbol, "AAPL");
  assertEquals(apple.class, "us_equity");
});

liveTest("options.all, get", async () => {
  const { option_contracts } = await t.options.all({ query: { underlying_symbols: "AAPL", limit: 1 } });
  assertEquals(option_contracts?.length, 1);
  const contract = await t.options.get(option_contracts![0].symbol);
  assertEquals(contract.underlying_symbol, "AAPL");
});

liveTest("options.all: a page of far-dated contracts, some never traded", async () => {
  // Untraded contracts have null close price and open interest, which the spec doesn't allow for
  const from = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
  const { option_contracts } = await t.options.all({
    query: { underlying_symbols: "AAPL", type: "call", expiration_date_gte: from, limit: 100 },
  });
  assertEquals(option_contracts?.length, 100);
});

liveTest("corporateActions.announcements, announcement", async () => {
  const announcements = await t.corporateActions.announcements({
    query: { ca_types: ["Dividend"], since: "2026-07-01", until: "2026-09-28", symbol: "AAPL" },
  });
  if (!announcements[0]) return console.log("  no announcements in range: announcement untested");
  assertEquals((await t.corporateActions.announcement(announcements[0].id)).id, announcements[0].id);
});

liveTest("calendar, clock", async () => {
  const days = await t.calendar("2026-01-01", "2026-01-10");
  assertEquals(days.map((day) => day.date)[0], "2026-01-02");
  assertEquals(typeof (await t.clock()).is_open, "boolean");
});

liveTest("markets.calendar, markets.clock", async () => {
  const { calendar } = await t.markets.calendar("XNYS", "2026-01-01", "2026-01-10");
  assert(calendar.length > 0);
  const { clocks } = await t.markets.clock();
  assert(clocks.length > 0);
});

liveTest("locates (live accounts only)", async () => {
  await assertUnavailableOnPaper(() => t.locates.list());
  await assertUnavailableOnPaper(() => t.locates.quotes({ query: { symbols: "AAPL" } }));
});

liveTest("tokenization (live accounts only)", async () => {
  await assertUnavailableOnPaper(() => t.tokenization.requests());
});

liveTest("cryptoFunding (live accounts only)", async () => {
  await assertUnavailableOnPaper(() => t.cryptoFunding.wallets());
  await assertUnavailableOnPaper(() => t.cryptoFunding.transfers());
  await assertUnavailableOnPaper(() => t.cryptoFunding.whitelist.list());
  await assertUnavailableOnPaper(() => t.cryptoFunding.vasps());
});

mutatingTest("watchlist: create, update, add, remove, delete", async () => {
  const name = `alpaca-sdk-test-${crypto.randomUUID().slice(0, 8)}`;
  let current = name;
  try {
    const list = await t.watchlists.create({ body: { name, symbols: ["AAPL"] } });
    assertEquals(list.name, name);
    assertEquals((await t.watchlists.getByName(name)).id, list.id);
    const added = await t.watchlists.addByID({ params: { watchlist_id: list.id }, body: { symbol: "MSFT" } });
    assertEquals(added.assets?.map((asset) => asset.symbol).sort(), ["AAPL", "MSFT"]);
    const removed = await t.watchlists.remove(list.id, "AAPL");
    assertEquals(removed.assets?.map((asset) => asset.symbol), ["MSFT"]);
    const renamed = await t.watchlists.updateByID({ params: { watchlist_id: list.id }, body: { name: `${name}-2` } });
    current = renamed.name;
    assertEquals(current, `${name}-2`);
  } finally {
    // By name, so cleanup works even when a response failed to parse
    await t.watchlists.deleteByName(current);
  }
  await assertRejects(() => t.watchlists.getByName(current), AlpacaError);
});

// BTC/USD rather than a stock: crypto trades around the clock, and an order in `accepted` status
// (market closed) can't be replaced
mutatingTest("order: limit buy far below market, get, replace, cancel", async () => {
  const client_order_id = `alpaca-sdk-test-${crypto.randomUUID()}`;
  try {
    const order = await t.orders.create({
      body: {
        symbol: "BTC/USD",
        qty: "0.011",
        side: "buy",
        type: "limit",
        limit_price: "1000",
        time_in_force: "gtc",
        client_order_id,
      },
    });
    assertEquals((await t.orders.get(order.id)).limit_price, "1000");
    const replaced = await t.orders.replace({ params: { order_id: order.id }, body: { limit_price: "1100" } });
    assertEquals(replaced.replaces, order.id);
    assertEquals(replaced.limit_price, "1100");
  } finally {
    // By client order id, so cleanup works even when a response failed to parse; follows replacements
    let order = await t.orders.getByClientID(client_order_id).catch(() => undefined);
    while (order?.replaced_by) order = await t.orders.get(order.replaced_by);
    if (order && !["canceled", "filled", "expired", "rejected"].includes(order.status)) await t.orders.delete(order.id);
  }
  const original = await t.orders.getByClientID(client_order_id);
  assertEquals(original.status, "replaced");
  const replacement = await t.orders.get(original.replaced_by!);
  assert(["canceled", "pending_cancel"].includes(replacement.status), replacement.status);
});

mutatingTest("order: multi-leg call spread far below market, get, search, cancel", async () => {
  // Two calls of one expiry at least two weeks out: buy the lower strike, sell the higher. The
  // spread is worth more than its 0.01 limit, so the order rests until it's canceled
  const from = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
  const { option_contracts } = await t.options.all({
    query: { underlying_symbols: "AAPL", type: "call", expiration_date_gte: from, limit: 100 },
  });
  const sameExpiry = option_contracts!.filter((c) => c.expiration_date === option_contracts![0].expiration_date)
    .sort((a, b) => Number(a.strike_price) - Number(b.strike_price));
  const [low, high] = sameExpiry.slice(Math.floor(sameExpiry.length / 2));
  assert(low && high, "need two AAPL calls of the same expiry");

  const client_order_id = `alpaca-sdk-test-${crypto.randomUUID()}`;
  try {
    const order = await t.orders.create({
      body: {
        order_class: "mleg",
        qty: "1",
        type: "limit",
        limit_price: "0.01",
        time_in_force: "day",
        client_order_id,
        legs: [
          { symbol: low.symbol, ratio_qty: "1", side: "buy", position_intent: "buy_to_open" },
          { symbol: high.symbol, ratio_qty: "1", side: "sell", position_intent: "sell_to_open" },
        ],
      },
    });
    // What the parent of a multi-leg order looks like, and what OrderSchema used to reject
    assertEquals(order.order_class, "mleg");
    assertEquals([order.symbol, order.side, order.asset_class], ["", "", ""]);
    assertEquals(order.legs?.map((leg) => leg.symbol), [low.symbol, high.symbol]);
    assertEquals((await t.orders.get(order.id, true)).legs?.length, 2);
    // One multi-leg order used to fail the whole list
    const open = await t.orders.search({ query: { status: "open", nested: true, limit: 500 } });
    assert(open.some((o) => o.id === order.id));
  } finally {
    const order = await t.orders.getByClientID(client_order_id).catch(() => undefined);
    if (order && !["canceled", "filled", "expired", "rejected"].includes(order.status)) await t.orders.delete(order.id);
  }
});

// Offline: these must never run live, since they'd cancel or close everything on the account

const offline = new Alpaca({ auth: { key: "KEY", secret: "SECRET" } });

Deno.test("orders.deleteAll: per-order failures in a 207 become an AggregateError", async () => {
  await withStubbedFetch(() => json([{ id: "a", status: 200 }, { id: "b", status: 500 }], 207), async (requests) => {
    const error = await assertRejects(() => offline.trading.orders.deleteAll(), AggregateError);
    assertEquals(error.errors.length, 1);
    assertInstanceOf(error.errors[0], AlpacaError);
    assertEquals(error.errors[0].status, 500);
    assertEquals(requests[0].method, "DELETE");
    assertEquals(requests[0].url.pathname, "/v2/orders");
  });
  await withStubbedFetch(() => json([{ id: "a", status: 200 }], 207), async () => {
    assertEquals(await offline.trading.orders.deleteAll(), [{ id: "a", status: 200 }]);
  });
});

Deno.test("positions.closeAll: per-position failures in a 207 become an AggregateError", async () => {
  await withStubbedFetch(() => json([{ symbol: "AAPL", status: 403 }], 207), async (requests) => {
    const error = await assertRejects(
      () => offline.trading.positions.closeAll({ query: { cancel_orders: true } }),
      AggregateError,
    );
    assertEquals(error.message, "Close All Positions: 1 of 1 failed");
    assertEquals(requests[0].url.search, "?cancel_orders=true");
  });
});
