// Broker endpoints aren't live-tested (no broker credentials), so this checks the request a broker
// call builds, against a stubbed fetch.
import { assertEquals, assertRejects } from "@std/assert";
import { Z } from "../src/external.ts";
import { Alpaca } from "../src/client.ts";
import { json, withStubbedFetch } from "./common.ts";

const order = {
  id: "61e69015-8549-4bfd-b9c3-01e75843f47d",
  client_order_id: "eb9e2aaa-f71a-4f51-b5b4-52a6c565dad4",
  created_at: "2026-10-09T14:30:00.123456Z",
  symbol: "AAPL",
  side: "buy",
  status: "new",
  type: "limit",
  time_in_force: "day",
  notional: null,
};

Deno.test("broker: Basic auth, sandbox host, two path params substituted", async () => {
  await withStubbedFetch(() => json(order), async (requests) => {
    const client = new Alpaca({ auth: { key: "BROKER_KEY", secret: "BROKER_SECRET" }, broker: true });
    const result = await client.broker.trading.orders.get({
      params: { account_id: "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415", order_id: order.id },
    });
    assertEquals(result.id, order.id);
    const [request] = requests;
    assertEquals(request.method, "GET");
    assertEquals(request.url.origin, "https://broker-api.sandbox.alpaca.markets");
    assertEquals(request.url.pathname, `/v1/trading/accounts/b0b6dd9d-8b9b-48a9-ba46-b9d54906e415/orders/${order.id}`);
    assertEquals(request.url.search, "");
    assertEquals(request.headers.get("authorization"), `Basic ${btoa("BROKER_KEY:BROKER_SECRET")}`);
    assertEquals(request.headers.get("APCA-API-KEY-ID"), null);
  });
});

Deno.test("broker: live host, args", async () => {
  await withStubbedFetch(() => json({}), async (requests) => {
    const client = new Alpaca({ auth: { key: "K", secret: "S" }, broker: true, paper: false });
    // Only the request matters here; the stubbed `{}` isn't a valid account
    await assertRejects(() => client.broker.accounts.get("acct/1"), Z.ZodError);
    assertEquals(requests[0].url.href, "https://broker-api.alpaca.markets/v1/accounts/acct%2F1");
  });
});
