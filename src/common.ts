import { Z } from "./external.ts";

export type AlpacaAPI = "Trading" | "Market" | "Broker";
export type APIMethod = "GET" | "OPTIONS" | "PUT" | "DELETE" | "POST" | "PATCH";
/**
 * Supported currencies for trading accounts.
 */
export const CurrencySchema = Z.enum(["USD", "..."]);

export type QueryParams = Record<string, string | number | boolean | null>;
export type BodyParams = Record<string, unknown>;

export const ExchangeSchema = Z.enum(["AMEX", "ARCA", "BATS", "NYSE", "NASDAQ", "NYSEARCA", "OTC"]);
