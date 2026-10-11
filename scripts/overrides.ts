// Corrections for places where Alpaca's OpenAPI specs don't match what the live API does. Each one
// patches the parsed spec before generation, keyed by the spec's own schema name or operationId, and
// says why. The generator fails on a key that no longer exists, so stale overrides get noticed.
import type { Operation, Schema } from "./spec.ts";

export interface Overrides {
  schemas?: Record<string, (schema: Schema) => void>;
  operations?: Record<string, (operation: Operation) => void>;
}

export const overrides: Record<"trading" | "market" | "broker", Overrides> = {
  trading: {},
  market: {},
  broker: {},
};
