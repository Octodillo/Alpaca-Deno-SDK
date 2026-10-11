// Every generated endpoint must be reachable through its API's namespace on `Alpaca`.
import { assertEquals } from "@std/assert";
import type { Endpoint } from "../src/client.ts";
import * as trading from "../src/generated/trading/endpoints.ts";
import { tradingEndpoints } from "../src/trading/mod.ts";
import * as market from "../src/generated/market/endpoints.ts";
import { marketEndpoints } from "../src/market/mod.ts";

const key = (endpoint: Endpoint) => `${endpoint.method} ${endpoint.path}`;

const collect = (tree: object, found = new Set<string>()): Set<string> => {
  for (const value of Object.values(tree)) {
    if ("okStatus" in value) found.add(key(value));
    else collect(value, found);
  }
  return found;
};

const missing = (generated: Record<string, Endpoint>, namespace: object) => {
  const reachable = collect(namespace);
  return Object.entries(generated).filter(([, endpoint]) => !reachable.has(key(endpoint))).map(([name]) => name);
};

Deno.test("coverage: trading", () => {
  assertEquals(missing(trading, tradingEndpoints), []);
});

Deno.test("coverage: market", () => {
  assertEquals(missing(market, marketEndpoints), []);
});
