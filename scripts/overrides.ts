// Corrections for places where Alpaca's OpenAPI specs don't match what the live API does. Each one
// patches the parsed spec before generation, keyed by the spec's own schema name or operationId, and
// says why. The generator fails on a key that no longer exists, so stale overrides get noticed.
import type { Operation, Parameter, Schema } from "./spec.ts";

export interface Overrides {
  schemas?: Record<string, (schema: Schema) => void>;
  parameters?: Record<string, (parameter: Parameter) => void>;
  operations?: Record<string, (operation: Operation) => void>;
}

const dateOrDateTime: Schema = {
  anyOf: [{ type: "string", format: "date" }, { type: "string", format: "date-time" }],
};

export const overrides: Record<"trading" | "market" | "broker", Overrides> = {
  trading: {
    parameters: {
      // The spec says date-time, but the API takes plain dates too (`start=2026-01-01`), which is what
      // most callers pass
      legacy_start: (parameter) => void (parameter.schema = dateOrDateTime),
      legacy_end: (parameter) => void (parameter.schema = dateOrDateTime),
    },
    schemas: {
      // Fields the spec omits, so they'd be stripped from parsed responses. The PDT trio is in Alpaca's
      // reference docs and Aria's hand-written schema but absent on paper; the rest show up on paper
      // responses
      Account: (schema) => {
        schema.properties = {
          ...schema.properties,
          pattern_day_trader: {
            type: "boolean",
            description: "Whether the account is flagged as a pattern day trader.",
          },
          daytrade_count: { type: "integer", description: "Day trades in the last 5 trading days." },
          daytrading_buying_power: { type: "string", format: "decimal", description: "Day trading buying power." },
          effective_buying_power: { type: "string", format: "decimal" },
          position_market_value: { type: "string", format: "decimal" },
          crypto_tier: { type: "integer" },
          admin_configurations: { type: "object" },
          user_configurations: { type: ["object", "null"] },
        };
      },
      // Same: live configurations include the day-trade and PDT checks, missing from the spec
      AccountConfigurations: (schema) => {
        schema.properties = {
          ...schema.properties,
          dtbp_check: {
            type: "string",
            enum: ["both", "entry", "exit"],
            description: "Day trading buying power check.",
          },
          pdt_check: { type: "string", enum: ["both", "entry", "exit"], description: "Pattern day trader check." },
          closing_transactions_only: { type: "boolean" },
        };
      },
      // Live orders carry `subtag` and `source` (null on paper), missing from the spec. And the spec
      // marks only notional/type/time_in_force required, so even `id` came out optional
      Order: (schema) => {
        schema.required = [
          ...schema.required ?? [],
          "id",
          "client_order_id",
          "created_at",
          "symbol",
          "side",
          "status",
        ];
        schema.properties = {
          ...schema.properties,
          subtag: { type: ["string", "null"] },
          source: { type: ["string", "null"] },
        };
      },
      // No `required` at all in the spec; every announcement has these. And `ca_type` reuses the
      // request's capitalized enum ("Dividend"), but responses are lowercase ("dividend")
      CorporateAnnouncement: (schema) => {
        schema.required = ["id", "corporate_action_id", "ca_type", "ca_sub_type"];
        schema.properties = {
          ...schema.properties,
          ca_type: { type: "string", enum: ["spinoff", "merger", "split", "reorg", "dividend"] },
        };
      },
      // Live assets still carry `easy_to_borrow`; the spec only has the newer `borrow_status`
      // `attributes` comes back null for assets without any (seen in watchlist responses)
      Assets: (schema) => {
        schema.properties = {
          ...schema.properties,
          easy_to_borrow: { type: "boolean" },
          attributes: { ...schema.properties!.attributes, type: ["array", "null"] },
        };
      },
    },
  },
  market: {},
  broker: {},
};
