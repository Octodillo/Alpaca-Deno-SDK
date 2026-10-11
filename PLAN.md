# Plan: finish alpaca-sdk

Handoff for a fresh context. Written 2026-10-10 at the end of a design session with Aria. Aria has
handed the whole project over: execute this plan end to end, committing and testing as you go. The
design decisions below are settled; don't reopen them unless one turns out not to work, and if so,
say why in the commit message.

## Goal

A complete, typed Deno/TypeScript SDK for Alpaca's three REST APIs (Trading, Market Data, Broker),
built on the "endpoints as data" design below, with every endpoint in Alpaca's OpenAPI specs
available and the commonly used ones live-tested against the paper account.

The project is being finished for completeness and as a portfolio piece. Aria's own trading work
is moving to Rust (`apca` crate), so favour a finished, clean, documented result over clever extras.

## Settled design

1. **Endpoints are plain data.** Each endpoint is an object declared with `satisfies Endpoint`, never
   annotated `: Endpoint`. An annotation widens the type and silently loses the schemas, so payloads
   go unchecked and responses become `unknown`. Endpoint objects hold no auth and no client.
2. **One public class, `Alpaca`**, in `src/client.ts`. `new Alpaca({ auth, paper })` is the only way
   to construct a client. It has `request(endpoint, ...args)`, `bind(endpoint)`, and one bound
   namespace field per API (`trading`, `market`, `broker`). There's no `alpaca()` factory function
   and no second construction path. Tree-shaking was deliberately given up: the SDK sends secret
   keys and so is server-side only, and bundle size doesn't matter there. If a lean build is ever
   needed, split a `Core` base class out of `Alpaca`. That change is additive.
3. **`request`/`bind` are arrow-function properties**, so destructuring (`const { request } = client`)
   keeps working. `test/client.ts` checks this.
4. **`args`** is an optional function on an endpoint that maps friendlier call arguments onto the
   payload, e.g. `calendar("2026-01-01", "2026-01-10")`. It's declared with method syntax
   (`args?(...args: unknown[]): unknown`) on purpose: method syntax lets any parameter list be
   assigned, and `Checked<E>` enforces that `args` returns that endpoint's own `Payload<E>`. Don't
   "fix" it back to arrow syntax or to `any`. Add `args` only where positional arguments are
   obvious (1–3 params). For anything with many optional params, take a single options object or
   leave `args` off.
5. **No `any`.** Aria explicitly asked for `unknown` or proper types instead.
6. Request values are validated with the schema, and **the parsed values are what get sent**.
   Null and undefined query values are left out.

### The namespace sketch

This is the design for `Alpaca`'s namespace fields, already type-checked and live-tested against
the paper API. In the repo, the fields go directly on `Alpaca` in `client.ts`; the `extends Core`
was only because the sketch lived outside the repo.

```ts
// Namespaces are plain data: nested objects of endpoint definitions
const tradingEndpoints = {
  clock: getClock,
  calendar: getCalendar,
  // account: { get: getAccount, history: getHistory },  ← nesting is fine
};

// Private glue: swaps each endpoint in a tree for client.bind(endpoint)
type Bound<T> = {
  [K in keyof T]: T[K] extends Endpoint ? (...args: Args<T[K]>) => Promise<Response<T[K]>> : Bound<T[K]>;
};

const isEndpoint = (value: object): value is Checked<Endpoint> => "okStatus" in value;

const bindAll = <T extends object>(client: Core, tree: T): Bound<T> =>
  Object.fromEntries(
    Object.entries(tree).map(([key, value]) => [
      key,
      isEndpoint(value) ? client.bind(value) : bindAll(client, value),
    ]),
  ) as Bound<T>;

export class Alpaca extends Core {
  readonly trading = bindAll(this, tradingEndpoints);
  // readonly market = bindAll(this, marketEndpoints);
  // readonly broker = bindAll(this, brokerEndpoints);
}
```

Known limit: `isEndpoint` tells endpoints from namespaces with `"okStatus" in value`, so never name
a namespace key `okStatus`. Namespace fields must not be named `request`, `bind`, `auth` or `paper`.

## Current state (as of this plan)

- Branch `main`, HEAD `72cc08d WIP: save local changes`. The working tree is dirty and does
  **not** type-check as a whole.
- **Keep:** `src/client.ts` (the new `Alpaca` transport, `Endpoint`, `Payload`, `Response`, `Args`,
  `Checked`), `src/trading/calendar.ts` (clock and calendar in the new style, calendar with
  `args`), `test/client.ts` (2 live tests, passing), and the `ClockSchema` fix in
  `src/trading/schemas.ts`. The API returns `-04:00` offsets with up to 8 fractional digits, which
  the old `.ffffffZ` regex rejected.
- **Superseded, to be deleted** once their replacements land:
  - the floating `endpoint()`, `FetchPayload` and `alpaca()` in `src/mod.ts`
  - the `(auth, paper) => ({...})` factories in `src/trading/{accounts,instruments}.ts`
  - every `client.fetch` call site in `src/trading/{orders,position,watchlists}.ts` and
    `src/market/{stock,option}.ts`. `AlpacaClient` no longer exists, so these are dead code.
  - `src/market/mod.ts` and `src/broker/mod.ts` (`class ... extends AlpacaClient`)
  - 30 zero-byte stub files under `src/broker/`, `src/market/` and `test/broker.ts`
  - `test/common.ts` and the old tests in `test/trading.ts`, which use `alpaca()`
- The hand-written schemas (`src/trading/schemas.ts`, 608 lines; `src/market/schema.ts`, 170
  lines) are replaced by generated ones (step 2). Before deleting them, diff their field lists
  against the generated schemas: any place the hand-written version is *stricter or more correct*
  should become a generator override. Git history keeps the originals.
- Deps: `src/external.ts` imports `npm:zod` **unpinned** (it currently resolves to 4.0.14) and
  dotenv from `deno.land/std@0.224.0`. There's no `deno.json`.
- `.env` (gitignored) holds paper **trading** keys as `key=` and `secret=`. There are no broker keys.
- Tooling: sessions run inside the `archlinux` distrobox, not on the SteamOS host, so the host
  notes in global CLAUDE.md don't describe this shell. In the container: Deno at
  `~/.deno/bin/deno` (not on PATH), no `jq` (use `python3 -I`), and `gcc` present. This unit has a known DRAM bit-flip fault (see the
  `deck-hardware-health` skill): for generated output, regenerate twice and diff before committing.

## Source of truth: Alpaca's OpenAPI specs

All three are OpenAPI 3.1, every operation has a unique `operationId`, and they're far more complete
than anything hand-written:

| Spec | URL | Ops | Schemas | Servers | Auth |
|---|---|---|---|---|---|
| Trading | `https://docs.alpaca.markets/openapi/trading-api.json` | 58 | 159 | `paper-api` / `api` | `APCA-API-KEY-ID` + `APCA-API-SECRET-KEY` headers |
| Market Data | `https://docs.alpaca.markets/openapi/market-data-api.json` | 44 | 149 | `data` / `data.sandbox` | headers **or** HTTP Basic |
| Broker | `https://docs.alpaca.markets/openapi/broker-api.json` | 162 | 378 | `broker-api.sandbox` / `broker-api` | HTTP Basic **only** |

Human-readable reference: https://docs.alpaca.markets/us/reference

Facts from surveying the specs that the transport currently gets wrong or can't express:

- **Path params:** up to 3 per path (broker has 24 with 2 params and 1 with 3). The current
  `path: string | ((param: string) => string)` only handles one.
- **Success codes:** 200, 201, 202, 204 and 207 all occur; 204 has no body, so `response.json()`
  would throw. Two broker ops declare no 2xx response at all.
- **Content types:** 13 operations return `text/event-stream` (SSE) and 1 returns `image/png`
  (logos). The rest are JSON.
- **Broker auth is Basic** (`Authorization: Basic base64(key:secret)`). The header auth currently
  hard-coded in `#send` won't work for broker.
- **Market data sandbox host** is `data.sandbox.alpaca.markets`, used with *broker* sandbox
  credentials; trading keys always use `data`. So the host depends on the kind of key, not just on
  `paper`.
- **Query arrays:** 7 array-typed query params. Alpaca expects comma-joined values
  (`symbols=AAPL,TSLA`); check each param's `style`/`explode` in the spec.
- **`operationId` casing differs:** Trading and Broker use camelCase, Market Data uses PascalCase
  (`News`, `LatestRates`). Normalize to camelCase. IDs are unique within a spec but collide across
  specs (e.g. `getAccount`), so keep generated output per API.

## Steps

Commit after each step, at minimum. Use AGENTS.md style (`alpaca-sdk: <imperative summary>`), end
each message with the Co-Authored-By line, and keep `git status` clean between steps. Each step's
check must pass before its commit.

### 0. Checkpoint and tooling
- Commit the current working tree as-is (`alpaca-sdk: checkpoint endpoint-as-data redesign`),
  including this file. Everything below is then reversible.
- Add `deno.json`:
  - pin `zod` to the resolved version (`npm:zod@4.0.14`) via an import map, and update `external.ts`
  - fmt settings matching the existing style: 2 spaces, double quotes, `lineWidth: 120`
  - tasks: `check` (`deno check src/ test/`), `test` (`deno test -A`), `fmt`, `lint`, `generate`
- Run `deno fmt` once and commit it **on its own**, so later diffs stay readable.

### 1. Generalize the transport (`src/client.ts`)
Before generating anything, extend `Endpoint` and `Alpaca` so they can express everything the specs need:
- **Path params:** make `path` a template string (`"v2/orders/{order_id}"`), add a `params` Zod
  object schema, and put `params` in `Payload` (stripped when the schema is `Z.never()`, like
  query and body). Substitute with `encodeURIComponent` and throw on a missing placeholder value.
  Remove the function-typed `path`.
- **Success:** `okStatus: number | number[]`. When the status is 204 or the response schema is
  `Z.void()`/`Z.undefined()`, skip JSON parsing.
- **Errors:** throw an exported `AlpacaError` (fields: status, endpoint name, parsed body when it's
  JSON). Alpaca error bodies are `{ code, message }`, so use the message. Keep `statusMessages`
  as an optional override.
- **Auth and hosts:** config becomes `{ auth, paper = true, broker = false }`. Trading keys:
  header auth, trading `paper-api`/`api`, data `data`. Broker keys: Basic auth, `broker-api.sandbox`/
  `broker-api`, data `data.sandbox`/`data`. Pick the auth style per API in `#send`. All three
  namespaces always exist; calling one with the wrong kind of key simply gets a 401. Don't add
  type-level gating.
- **Query arrays:** allow `string[]` in `QueryParams` and comma-join them.
- **Out of scope:** SSE and PNG. The generator skips those 14 operations and lists them in the README.
- Add `bindAll` and the namespace fields (from the sketch) directly to `Alpaca`, and delete
  `alpaca()`, `endpoint()` and `FetchPayload` from `mod.ts`. `mod.ts` becomes the public barrel:
  re-export `client.ts` and the generated endpoint modules.
- Check: update `test/client.ts`, which must still pass, plus type-level negative tests (below).
  Commit.

### 2. Generator (`scripts/generate.ts`, Deno, no new deps)
- Vendor the three specs into `spec/` with a `spec/SHA256SUMS` file. Generate from the vendored
  copies (reproducible); downloading is a separate `--update` flag.
- Emit, per API, `src/generated/<api>/schemas.ts` (Zod schemas from `components.schemas`, in
  dependency order, with `Z.lazy` for cycles) and `src/generated/<api>/endpoints.ts` (one
  `export const <operationId> = {...} satisfies Endpoint` per operation). Group by tag with a
  section comment, and use the spec's `summary` as `name` plus a JSDoc line.
- Map OpenAPI to Zod:
  - objects become `Z.object` (non-strict, so new API fields don't break parsing); a field not in
    `required` becomes `.optional()`; `nullable` or a `type` that includes `"null"` becomes `.nullable()`
  - `format: date-time` becomes `Z.iso.datetime({ offset: true })`, `date` becomes `Z.iso.date()`
  - `enum` becomes `Z.enum`; `oneOf`/`anyOf` become `Z.union`, using a discriminated union when the
    spec gives a discriminator; `allOf` becomes merged objects; `$ref` uses the named schema;
    numbers with `format: decimal`, or strings holding money, stay `Z.string()` (Alpaca sends
    decimals as strings)
- **Overrides:** `scripts/overrides.ts` holds per-schema and per-operation corrections, for places
  where the spec doesn't match reality. Never hand-edit files in `src/generated/`, which get a
  "do not edit" header. Each override carries a comment explaining why (e.g. "live API returns
  null here; spec says required").
- Check: `deno task generate` twice and `diff -r` the outputs (they must be identical, and this
  also guards against the hardware fault), then `deno task check`. Commit the spec, the generator
  and its output together.

### 3. Trading API: wire up, translate, test
- `src/trading/mod.ts` exports the `tradingEndpoints` namespace object built from generated
  endpoints, using the existing hand-written module names as the namespace shape: `account`,
  `orders`, `positions`, `watchlists`, `assets`, `calendar`, `clock`, etc. Read the old
  `orders.ts`, `position.ts`, `watchlists.ts`, `accounts.ts` and `instruments.ts` for the names
  and groupings Aria chose, and for any custom behaviour (e.g. `deleteAll` turning per-order 207
  failures into errors), then port that behaviour.
- Add `args` with spread: `{ ...generated.getCalendar, args: (start?, end?, date_type?) => ... }
  satisfies Endpoint` for the obvious cases (calendar, clock, get-by-id, get-by-symbol).
- Port `trading/calendar.ts` the same way, then delete it.
- Delete the superseded trading files and the old `schemas.ts` (after the stricter-field diff from
  "Current state"), then commit.
- Live tests, `test/trading.ts`: one test per read-only endpoint. Commit.

### 4. Market Data API
Same pattern: `src/market/mod.ts` builds a `marketEndpoints` namespace (`stock`, `crypto`,
`option`, `forex`, `news`, `screener`, `corporateActions`, `fixedIncome`, `logos`), shaped after
the old `market/mod.ts` and `stock.ts`. Live-test the free-tier endpoints (stock with
`feed=iex`, crypto, news, screener). For subscription-gated ones (SIP, options), a 403 counts as a
pass: assert the error is an `AlpacaError` with status 403, and log it. Commit.

### 5. Broker API
Same pattern; the namespaces follow the spec's tags. **There are no broker credentials**, so
broker gets type-checks and one offline test only: build the request with a stubbed `fetch` and
assert the Basic auth header, host and path substitution. Say clearly in the README that broker
endpoints aren't live-tested. Commit.

### 6. Finish
- README: what it is, a usage example (`new Alpaca`, a namespace call, the `request` escape hatch),
  the design choices (the "Settled design" section, condensed), coverage (264 operations, minus
  the 14 SSE/PNG ones), how to regenerate, test policy, and status: complete, Deno, not published.
  Mention that Aria's trading work continues in Rust with `apca`.
- Delete this PLAN.md in the final commit; the README replaces it.
- Final check: `deno task fmt --check`, `deno task lint`, `deno task check` and `deno task test`
  all clean. Report the test counts.

## Testing policy (read before writing any live test)

- Live tests use the **paper** account in `.env`. Tests skip cleanly when `.env` has no keys.
- **Never call anything that affects state you didn't create.** Specifically: no cancel-all
  orders, no close-all positions, no closing positions you didn't open, no account configuration
  `PATCH`, no crypto funding/transfers, no locates. Aria's paper account may hold positions they
  care about.
- Mutating tests are allowed only when they clean up after themselves, and only behind
  `ALPACA_MUTATING_TESTS=1`:
  - create a watchlist with a unique name, then delete it
  - place a limit buy far below market (e.g. 1 share of AAPL at $1, `time_in_force: day`), then
    get it, replace it and cancel it
  
  Use `try/finally` so cleanup runs even when an assertion fails. Run them once with the flag set
  and report the result; the default `deno task test` stays read-only.
- **Type-level tests:** a `test/types.ts` that must *fail* type-checking in specific places. Use
  `// @ts-expect-error` so `deno check` passes only while each of these is still rejected:
  - wrong `args` type
  - invalid enum value
  - query on a no-query endpoint
  - missing path param
  - an `args` that returns the wrong payload
  - an `: Endpoint` annotation that loses types (assert `Response` is not `unknown`)
  
  These are what the design is for, so keep them passing.
- Market data rate limit: 200 req/min on the free tier. Run tests sequentially and keep them
  small (`limit=1`).

## Done when

- All 250 non-SSE/PNG operations exist as typed endpoints and are reachable through `new Alpaca(...)`
  namespaces.
- Every read-only trading and free-tier market endpoint has a passing live test, and the mutating
  tests pass with the flag set.
- No `any` in `src/` (`rg '\bany\b' src` finds only comments), no dead modules, no zero-byte files.
- fmt, lint, check and test are clean, the README is written and this file is removed.
- Report back to Aria: what got generated, what needed overrides and why, what's untested, and
  any spec/API mismatches found (these may be worth reporting to Alpaca).
