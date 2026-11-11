import { assert, assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
import { Z } from "../src/external.ts";
import { Alpaca, AlpacaError, Endpoint } from "../src/client.ts";
import { tradingEndpoints } from "../src/trading/mod.ts";
import { auth, json, live, withStubbedFetch } from "./common.ts";

const keys = { key: "KEY", secret: "SECRET" };

const getThing = {
  name: "Get Thing",
  api: "broker",
  method: "GET",
  path: "v1/accounts/{account_id}/things/{thing_id}",

  params: Z.object({ account_id: Z.string(), thing_id: Z.string() }),
  query: Z.object({ symbols: Z.string().array().optional(), limit: Z.number().optional(), page: Z.string().nullish() }),
  body: Z.never(),
  response: Z.object({ ok: Z.boolean() }),

  okStatus: 200,
} satisfies Endpoint;

const deleteThing = {
  name: "Delete Thing",
  api: "trading",
  method: "DELETE",
  path: "v2/things/{thing_id}",

  params: Z.object({ thing_id: Z.string() }),
  query: Z.never(),
  body: Z.never(),
  response: Z.void(),

  okStatus: [200, 204],
  statusMessages: { 422: "Delete Thing: not deletable" },
} satisfies Endpoint;

const createThing = {
  name: "Create Thing",
  api: "data",
  method: "POST",
  path: "v1/things",

  params: Z.never(),
  query: Z.never(),
  headers: Z.object({ "Idempotency-Key": Z.string().optional() }),
  body: Z.object({ qty: Z.number().transform(String) }),
  response: Z.object({ id: Z.string() }),

  okStatus: 201,
} satisfies Endpoint;

Deno.test("params are substituted and encoded, query arrays comma-joined, nulls dropped", async () => {
  await withStubbedFetch(() => json({ ok: true }), async (requests) => {
    const client = new Alpaca({ auth: keys, broker: true });
    const result = await client.request(getThing, {
      params: { account_id: "a/b", thing_id: "t 1" },
      query: { symbols: ["AAPL", "TSLA"], limit: 1, page: null },
    });
    assertEquals(result, { ok: true });
    const [request] = requests;
    assertEquals(request.url.host, "broker-api.sandbox.alpaca.markets");
    assertEquals(request.url.pathname, "/v1/accounts/a%2Fb/things/t%201");
    assertEquals(request.url.searchParams.get("symbols"), "AAPL,TSLA");
    assertEquals(request.url.searchParams.get("limit"), "1");
    assert(!request.url.searchParams.has("page"));
  });
});

Deno.test("missing path param throws before sending", async () => {
  await withStubbedFetch(() => json({ ok: true }), async (requests) => {
    const client = new Alpaca({ auth: keys });
    // Bypasses the types on purpose to reach the runtime check
    const payload = { params: { account_id: "a" } } as unknown as Parameters<typeof client.request<typeof getThing>>[1];
    await assertRejects(() => client.request(getThing, payload), Error, "thing_id");
    assertEquals(requests.length, 0);
  });
});

Deno.test("dot path params throw before sending: the URL parser would drop the segment", async () => {
  // `v2/things/.` normalizes to `v2/things/`, the collection, so DELETE would hit delete-all
  await withStubbedFetch(() => new Response(null, { status: 204 }), async (requests) => {
    const client = new Alpaca({ auth: keys });
    for (const thing_id of [".", ".."]) {
      await assertRejects(() => client.request(deleteThing, { params: { thing_id } }), TypeError, "thing_id");
    }
    assertEquals(requests.length, 0);
    // Dots inside a longer value are ordinary characters (BRK.B)
    await client.request(deleteThing, { params: { thing_id: "BRK.B" } });
    await client.request(deleteThing, { params: { thing_id: "..." } });
    assertEquals(requests.map((r) => r.url.pathname), ["/v2/things/BRK.B", "/v2/things/..."]);
  });
});

Deno.test("auth: broker API uses Basic, trading uses key headers", async () => {
  await withStubbedFetch(() => new Response(null, { status: 204 }), async (requests) => {
    await new Alpaca({ auth: keys }).request(deleteThing, { params: { thing_id: "1" } });
    await new Alpaca({ auth: keys, paper: false }).request(deleteThing, { params: { thing_id: "1" } });
    assertEquals(requests[0].url.host, "paper-api.alpaca.markets");
    assertEquals(requests[0].headers.get("APCA-API-KEY-ID"), "KEY");
    assertEquals(requests[0].headers.get("APCA-API-SECRET-KEY"), "SECRET");
    assert(!requests[0].headers.has("authorization"));
    assertEquals(requests[1].url.host, "api.alpaca.markets");
  });
  await withStubbedFetch(() => json({ ok: true }), async (requests) => {
    await new Alpaca({ auth: keys, broker: true, paper: false })
      .request(getThing, { params: { account_id: "a", thing_id: "b" } });
    assertEquals(requests[0].url.host, "broker-api.alpaca.markets");
    assertEquals(requests[0].headers.get("authorization"), `Basic ${btoa("KEY:SECRET")}`);
    assert(!requests[0].headers.has("APCA-API-KEY-ID"));
  });
});

Deno.test("data host and auth depend on the kind of key", async () => {
  await withStubbedFetch(() => json({ id: "x" }, 201), async (requests) => {
    const payload = { body: { qty: 5 } };
    await new Alpaca({ auth: keys }).request(createThing, payload);
    await new Alpaca({ auth: keys, paper: false }).request(createThing, payload);
    await new Alpaca({ auth: keys, broker: true }).request(createThing, payload);
    await new Alpaca({ auth: keys, broker: true, paper: false }).request(createThing, payload);
    assertEquals(requests.map((r) => r.url.host), [
      "data.alpaca.markets",
      "data.alpaca.markets",
      "data.sandbox.alpaca.markets",
      "data.alpaca.markets",
    ]);
    assertEquals(requests[0].headers.get("APCA-API-KEY-ID"), "KEY");
    assertEquals(requests[2].headers.get("authorization"), `Basic ${btoa("KEY:SECRET")}`);
  });
});

Deno.test("body and headers send the parsed values", async () => {
  await withStubbedFetch(() => json({ id: "x" }, 201), async (requests) => {
    const result = await new Alpaca({ auth: keys }).request(createThing, {
      body: { qty: 5 },
      headers: { "Idempotency-Key": "abc" },
    });
    assertEquals(result, { id: "x" });
    assertEquals(requests[0].body, JSON.stringify({ qty: "5" }));
    assertEquals(requests[0].headers.get("content-type"), "application/json");
    assertEquals(requests[0].headers.get("Idempotency-Key"), "abc");
  });
});

Deno.test("void responses skip JSON parsing, with or without a body", async () => {
  for (const response of [() => new Response(null, { status: 204 }), () => new Response("", { status: 200 })]) {
    await withStubbedFetch(response, async () => {
      const result = await new Alpaca({ auth: keys }).request(deleteThing, { params: { thing_id: "1" } });
      assertStrictEquals(result, undefined);
    });
  }
});

Deno.test("errors throw AlpacaError with the API's message", async () => {
  await withStubbedFetch(() => json({ code: 40410000, message: "thing not found" }, 404), async () => {
    const error = await assertRejects(
      () => new Alpaca({ auth: keys }).request(deleteThing, { params: { thing_id: "1" } }),
      AlpacaError,
    );
    assertEquals(error.status, 404);
    assertEquals(error.endpoint, "Delete Thing");
    assertEquals(error.body, { code: 40410000, message: "thing not found" });
    assertEquals(error.message, "Delete Thing: 404 thing not found");
  });
  await withStubbedFetch(() => new Response("nope", { status: 422 }), async () => {
    const error = await assertRejects(
      () => new Alpaca({ auth: keys }).request(deleteThing, { params: { thing_id: "1" } }),
      AlpacaError,
    );
    assertEquals(error.message, "Delete Thing: not deletable");
    assertEquals(error.body, undefined);
  });
});

Deno.test("request validates before sending", async () => {
  await withStubbedFetch(() => json({ id: "x" }, 201), async (requests) => {
    const body = { qty: "5" } as unknown as { qty: number };
    await assertRejects(() => new Alpaca({ auth: keys }).request(createThing, { body }));
    assertEquals(requests.length, 0);
  });
});

Deno.test("a missing required part throws before sending", async () => {
  const searchThings = {
    name: "Search Things",
    api: "trading",
    method: "GET",
    path: "v2/things",

    params: Z.never(),
    query: Z.object({ timeframe: Z.string(), limit: Z.number().optional() }),
    body: Z.never(),
    response: Z.object({ ok: Z.boolean() }),

    okStatus: 200,

    args: (query: { timeframe: string; limit?: number }) => ({ query }),
  } satisfies Endpoint;

  await withStubbedFetch(() => json({ ok: true, id: "x" }, 201), async (requests) => {
    const client = new Alpaca({ auth: keys });
    // Each call bypasses the types on purpose, as untyped callers and casts do
    await assertRejects(() => client.request(searchThings, undefined as never), Z.ZodError, "timeframe");
    await assertRejects(() => client.request(createThing, {} as never), Z.ZodError);
    await assertRejects(() => client.request(createThing, { body: undefined } as never), Z.ZodError);
    await assertRejects(() => client.request(deleteThing, {} as never), Z.ZodError, "thing_id");
    assertEquals(requests.length, 0);
  });
});

Deno.test("args may leave optional parts undefined", async () => {
  const getQuote = {
    name: "Get Quote",
    api: "data",
    method: "GET",
    path: "v2/stocks/{symbol}/quotes/latest",

    params: Z.object({ symbol: Z.string() }),
    query: Z.object({ feed: Z.enum(["iex", "sip"]).optional() }),
    body: Z.never(),
    response: Z.object({ symbol: Z.string() }),

    okStatus: 200,

    args: (symbol: string, query?: { feed?: "iex" | "sip" }) => ({ params: { symbol }, query }),
  } satisfies Endpoint;

  await withStubbedFetch(() => json({ symbol: "AAPL" }), async (requests) => {
    const client = new Alpaca({ auth: keys });
    assertEquals(await client.request(getQuote, "AAPL"), { symbol: "AAPL" });
    assertEquals(requests[0].url.search, "");
  });
});

Deno.test({ name: "live: request clock", ignore: !auth }, async () => {
  const { request } = live; // destructured on purpose: checks `this` survives
  const clock = await request(tradingEndpoints.clock);
  assertEquals(typeof clock.is_open, "boolean");
});

Deno.test({ name: "live: bind calendar with args", ignore: !auth }, async () => {
  const { bind } = live; // destructured on purpose: checks `this` survives
  const calendar = bind(tradingEndpoints.calendar);
  const days = await calendar("2026-01-01", "2026-01-10");
  assertEquals(days[0].date, "2026-01-02");
});

Deno.test({ name: "live: namespace call", ignore: !auth }, async () => {
  const days = await live.trading.calendar("2026-01-01", "2026-01-10");
  assertEquals(days.length, 6);
});
