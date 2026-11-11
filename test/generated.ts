// What the generator and overrides must get right, checked on the generated schemas themselves.
import { assert, assertEquals } from "@std/assert";
import { Z } from "../src/external.ts";
import { Alpaca, type Endpoint } from "../src/client.ts";
import * as trading from "../src/generated/trading/endpoints.ts";
import * as market from "../src/generated/market/endpoints.ts";
import * as broker from "../src/generated/broker/endpoints.ts";
import { OrderSchema as TradingOrderSchema } from "../src/generated/trading/schemas.ts";
import { OrderSchema as BrokerOrderSchema } from "../src/generated/broker/schemas.ts";
import { json, withStubbedFetch } from "./common.ts";

const all: Record<string, Endpoint>[] = [trading, market, broker];

Deno.test("generated: date filters documented as YYYY-MM-DD accept plain dates and date-times", () => {
  const queries = [
    trading.getAccountActivities.query,
    trading.getAccountActivitiesByActivityType.query,
    broker.getAccountActivities.query,
    broker.getAccountActivitiesByType.query,
  ];
  for (const query of queries) {
    for (const key of ["date", "after", "until"]) {
      assert(query.safeParse({ [key]: "2026-10-09" }).success, `${key} rejects a plain date`);
      assert(query.safeParse({ [key]: "2026-10-09T13:30:00Z" }).success, `${key} rejects a date-time`);
      assert(!query.safeParse({ [key]: "last tuesday" }).success, `${key} accepts anything`);
    }
  }
});

Deno.test("generated: no GET discards its response", async () => {
  // The spec declares a few GETs with a contentless 200. They do return data, so they must not be void
  const voidGets = all.flatMap((endpoints) =>
    Object.entries(endpoints).filter(([, { method, response }]) => method === "GET" && response instanceof Z.ZodVoid)
  ).map(([name]) => name);
  assertEquals(voidGets, []);

  const bank = { bank_id: "be3c368a-4c7c-4384-808e-f02c9f5a8afe", status: "APPROVED" };
  await withStubbedFetch(() => json(bank), async () => {
    const client = new Alpaca({ auth: { key: "K", secret: "S" }, broker: true });
    const params = { account_id: "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415" };
    assertEquals(await client.broker.fundingWallets.recipientBank.get({ params }), bank);
  });
});

Deno.test("generated: a request body is required unless an override says it's optional", () => {
  // The spec rarely sets `requestBody.required`, and an optional body lets `{ params }` alone
  // type-check and send an empty POST
  const optionalBodies = all.flatMap((endpoints) =>
    Object.entries(endpoints).filter(([, { body }]) => body.safeParse(undefined).success)
  ).map(([name, { api }]) => `${api}.${name}`);
  assertEquals(optionalBodies, ["broker.optionDoNotExercise", "broker.optionExercise"]);

  assert(!trading.addAssetToWatchlist.body.safeParse({}).success, "adding to a watchlist takes a symbol");
  assert(trading.patchAccountConfig.body.safeParse({ no_shorting: true }).success);
});

const specExamples = async (file: string): Promise<Record<string, { value: unknown }>> =>
  JSON.parse(await Deno.readTextFile(new URL(`../spec/${file}`, import.meta.url))).components.examples;

Deno.test("generated: the specs' own order examples parse, multi-leg included", async () => {
  // A multi-leg parent has no symbol, side or asset class of its own (all ""), and its legs no type
  const cases = [
    { file: "trading-api.json", schema: TradingOrderSchema },
    { file: "broker-api.json", schema: BrokerOrderSchema },
  ];
  for (const { file, schema } of cases) {
    const examples = Object.entries(await specExamples(file)).filter(([name]) => name.endsWith("OrderResponse"));
    assertEquals(examples.length, 6, file);
    for (const [name, { value }] of examples) {
      const result = schema.safeParse(value);
      assert(result.success, `${file} ${name}: ${result.error && Z.prettifyError(result.error)}`);
    }
  }

  const { MultilegOptionsOrderResponse } = await specExamples("trading-api.json");
  const order = TradingOrderSchema.parse(MultilegOptionsOrderResponse.value);
  assertEquals([order.side, order.asset_class, order.symbol], ["", "", ""]);
  assertEquals(order.legs?.map((leg) => [leg.side, leg.type]), [["buy", ""], ["sell", ""]]);
  // Leniency is for responses only: an order can't be submitted with a blank side
  const blank = { symbol: "AAPL", qty: "1", side: "", type: "market", time_in_force: "day" };
  assert(!trading.postOrder.body.safeParse(blank).success);
});
