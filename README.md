# alpaca-sdk

A typed Deno/TypeScript client for [Alpaca](https://alpaca.markets)'s three REST APIs: Trading, Market Data and Broker.
Endpoints and their Zod schemas are generated from Alpaca's OpenAPI specs, so request payloads are checked at compile
time and validated at runtime, and responses come back parsed and typed.

**Status:** complete. Deno only, not published. My own trading work has moved on to Rust with
[`apca`](https://crates.io/crates/apca); this repo is finished and kept as a reference.

## Usage

```ts
import { Alpaca } from "./src/mod.ts";

const alpaca = new Alpaca({ auth: { key: "...", secret: "..." } }); // paper: true by default

const account = await alpaca.trading.account.get();
const days = await alpaca.trading.calendar("2026-01-01", "2026-01-10");
const bars = await alpaca.market.stock.historical.bars("AAPL", { timeframe: "1Hour", feed: "iex" });

// Without friendlier args, a call takes the endpoint's payload: { params, query, headers, body }
const order = await alpaca.trading.orders.create({
  body: { symbol: "AAPL", qty: "1", side: "buy", type: "limit", limit_price: "150", time_in_force: "day" },
});
```

`request` is the escape hatch: it sends any endpoint definition, including one you write yourself.

```ts
import { Alpaca, type Endpoint, tradingEndpoints, Z } from "./src/mod.ts";

const { request, bind } = alpaca; // safe to destructure
const clock = await request(tradingEndpoints.clock);

const getMoon = {
  name: "Get Moon",
  api: "trading",
  method: "GET",
  path: "v2/moons/{moon_id}",
  params: Z.object({ moon_id: Z.string() }),
  query: Z.never(),
  body: Z.never(),
  response: Z.object({ phase: Z.string() }),
  okStatus: 200,
  args: (moon_id: string) => ({ params: { moon_id } }),
} satisfies Endpoint;

const moon = bind(getMoon);
const { phase } = await moon("full");
```

Broker keys use HTTP Basic auth and the broker sandbox; pass `broker: true`:

```ts
const broker = new Alpaca({ auth: { key, secret }, broker: true });
await broker.broker.accounts.get(accountId);
```

Errors are `AlpacaError`s with `status`, `endpoint` and the parsed `body`, and the message is the one Alpaca sent. Any
2xx is a success. If a 2xx body doesn't match the endpoint's schema, the call throws an `AlpacaResponseError` (an
`AlpacaError` with a 2xx `status`, the raw `body`, and the `ZodError` as `cause`): the request itself went through, so
don't retry it as a failure. Invalid request values throw a plain `ZodError` before anything is sent. Endpoints that
answer 207 per item (cancel all orders, close all positions) throw an `AggregateError` of `AlpacaError`s when any item
fails.

## Design

- **Endpoints are plain data.** Each endpoint is an object holding its method, a `{name}` path template, Zod schemas for
  `params`, `query`, optional `headers`, `body` and `response`, and its documented success status(es). It holds no auth
  and no client. Endpoints are declared with `satisfies Endpoint`, never annotated `: Endpoint`, since an annotation
  widens the type and loses the schemas.
- **One class, `Alpaca`.** `new Alpaca({ auth, paper, broker })` is the only way to build a client. It has
  `request(endpoint, ...args)`, `bind(endpoint)` and one namespace per API (`trading`, `market`, `broker`), each a
  nested object of bound endpoints. `request` and `bind` are arrow properties, so destructuring works. Because the SDK
  sends secret keys, it's meant for server-side use only, so tree-shaking was traded away for this simpler surface.
- **`args`** optionally maps friendlier positional arguments onto the payload, as in `calendar(start, end)`. They're
  only added where the arguments are obvious; everything else takes the payload. The types reject an `args` that doesn't
  produce its endpoint's own payload, including inside a namespace.
- **Validation:** request values go through their schemas, and the parsed values are what get sent. A required part
  that's missing at runtime fails there too, before anything is sent. Null and undefined query values are dropped and
  arrays are comma-joined. Response objects are non-strict, so new API fields don't break parsing (unknown keys are
  dropped).
- **No `any`.** `test/types.ts` holds `@ts-expect-error` cases that must stay type errors: wrong `args` types, invalid
  enum values, a query on a no-query endpoint, a missing path param, an `args` returning the wrong payload, and the
  `: Endpoint` annotation that loses the response type.

Hosts follow the kind of key. Trading keys use `paper-api`/`api` for trading and `data` for market data. Broker keys use
`broker-api.sandbox`/`broker-api` and `data.sandbox`/`data`.

## Coverage

Alpaca's specs describe 264 operations. 247 are generated and reachable through the namespaces (57 trading, 42 market
data, 148 broker), and `test/coverage.ts` checks that every one is reachable. The other 17 return something other than
JSON and are out of scope:

- 13 server-sent event streams (`text/event-stream`): trading and broker activity/status streams, and the market data
  corporate actions stream
- 2 logo images (`image/png`): market data `Logos`, and broker `get-v1beta1-logos-symbol` (the spec declares no content
  type for it; an override marks it as PNG)
- 2 broker document downloads, which only declare a 301 redirect to a PDF

The full list is at the end of each `src/generated/<api>/endpoints.ts`.

## Regenerating

```sh
deno task generate            # from the vendored specs in spec/, verified against spec/SHA256SUMS
deno task generate --update   # download fresh specs and rewrite the checksums first
```

`scripts/generate.ts` writes `src/generated/<api>/{schemas,endpoints}.ts`. Those files are never edited by hand. Where
the spec doesn't match the live API, `scripts/overrides.ts` patches the parsed spec before generation, with a comment
explaining each patch. Current overrides:

- Fields the live API sends but the spec omits, which parsing would otherwise drop: several on `Account`, two on
  `AccountConfigurations`, `subtag`/`source` on `Order`, `easy_to_borrow` on `Assets`, `description` on
  `NonTradeActivities` (whose `date` is also a plain date, not the date-time the spec declares)
- Required fields the spec doesn't mark: `Order.id` and friends, and `CorporateAnnouncement` (whose spec has no
  `required` at all)
- Nullability: `Assets.attributes`, the auction sides of `stock_daily_auctions`, and an untraded `OptionContract`'s
  close price and open interest
- Multi-leg orders: the parent's `side` and `asset_class` (and a leg's `type`) come back as `""`, which the enums
  reject, so order responses accept it. Broker's `OrderStatus` gains `held`
- `CorporateAnnouncement.ca_type`: responses are lowercase, the spec reuses the capitalized request enum
- Calendar `start`/`end` accept plain dates as well as date-times. (Date filters whose description says "YYYY-MM-DD",
  such as market data `start`/`end` and the activities `date`/`after`/`until`, get this from the generator itself.)
- Request bodies: the generator treats every declared body as required, since the specs rarely say. Broker's option
  `exercise`/`doNotExercise` are marked optional, and adding to a watchlist requires its `symbol`
- Broker logos: declared without content, actually a PNG
- Broker `GET v1/corporate_actions/announcements/{id}`: declared without content, returns an `Announcement`

A `oneOf`/`anyOf` of object schemas without a usable discriminator (account activities, the details of an
`ActivityEventV2`, the JIT report) is generated as one object with every member's properties, each required only if
every member requires it. A `Z.union` would match the first member whose required fields happen to be present and strip
the fields of the shape the API actually sent. The price is a wider type: tell a fill from a dividend by
`activity_type`.

A GET that the spec declares without content and no override covers (broker's funding wallet recipient bank) returns its
JSON as `unknown` rather than discarding it.

## Tests

```sh
deno task test     # offline tests, plus read-only live tests when .env has keys
deno task check    # type-check, including the negative type tests
deno task fmt --check && deno task lint
```

Live tests use paper trading keys from `.env` (`key=...`, `secret=...`) and skip without them.

- Read-only endpoints each have a live test. Ones paper accounts don't serve (locates, tokenization, crypto funding) and
  subscription-gated market data (SIP, forex, fixed income) pass when they fail cleanly with the expected `AlpacaError`
  status.
- Tests never touch state they didn't create: no cancel-all, no close-all, no account configuration changes. Cancel-all
  and close-all are tested offline against a stubbed `fetch`.
- `ALPACA_MUTATING_TESTS=1` adds tests that create a watchlist, a far-below-market BTC/USD limit order and a
  far-below-market multi-leg AAPL call spread, exercise them, and clean up in `finally`.
- **Broker endpoints are not live-tested**, because no broker credentials were available. They're type-checked, and
  `test/broker.ts` checks the request they build (Basic auth, hosts, path substitution) against a stubbed `fetch`.
