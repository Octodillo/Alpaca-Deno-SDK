import { loadSync, Z } from "./external.ts";
import { trading } from "./trading/mod.ts";
import { ClockSchema } from "./trading/schemas.ts";

export interface FetchPayload {
  query?: QueryParams;
  body?: BodyParams;
}

export type APIMethod = "GET" | "OPTIONS" | "PUT" | "DELETE" | "POST" | "PATCH";
/**
 * Supported currencies for trading accounts.
 */

export type QueryParams = Record<string, string | number | boolean | null>;
export type BodyParams = Record<string, unknown>;

export interface AlpacaAuth {
  key: string;
  secret: string;
}

export interface AlpacaConfig {
  auth?: AlpacaAuth;
  paper?: boolean;
}

type StripNever<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : K]: T[K];
};

export const alpaca = (config: AlpacaConfig) => {
  const auth: AlpacaAuth = config.auth ?? (loadSync() as unknown as AlpacaAuth); // TODO zodify
  const paper = config.paper === undefined ? true : config.paper;
  return {
    trading: trading(auth, paper),
    // market: market(auth),
    // broker: broker(auth),
  };
};

export const endpoint = async <
  ZQuery extends Z.ZodType<QueryParams>,
  ZBody extends Z.ZodType<BodyParams>,
  ZResponse extends Z.ZodType
>(params: {
  name: string;
  api: string;
  endpoint: string;
  method: APIMethod;

  querySchema: ZQuery;
  bodySchema: ZBody;
  responseSchema: ZResponse;

  okStatus: number;
  statusMessages?: Record<number, string>;
  auth: AlpacaAuth;

  payload: StripNever<{ query: Z.input<ZQuery>; body: Z.input<ZBody> }>;
}) => {
  const prepared: FetchPayload = {};
  const base = `https://${params.api}.alpaca.markets/`;
  const url = new URL(params.endpoint, base);
  const requestInit: RequestInit = {
    method: params.method,
    headers: {
      accept: "application/json",
      "APCA-API-KEY-ID": params.auth.key,
      "APCA-API-SECRET-KEY": params.auth.secret,
    },
  };

  if ("query" in params.payload) {
    prepared.query = params.querySchema.parse(params.payload.query);
    const queryEntries = Object.entries(params.payload.query as object);
    queryEntries.forEach(([key, value]) => url.searchParams.set(key, value?.toString() ?? ""));
  }

  if ("body" in params.payload) {
    prepared.body = params.bodySchema.parse(params.payload.body);
    requestInit.headers = {
      ...requestInit.headers,
      "content-type": "application/json",
    };
    requestInit.body = JSON.stringify(params.payload.body);
  }

  const response = await fetch(url, requestInit);
  if (response.status === params.okStatus) return params.responseSchema.parse(await response.json());
  throw new Error(
    params.statusMessages?.[response.status] ??
      `${params.name}: Undocumented response ${response.status}: ${response.statusText}`
  );
};

const _client =
  (client: { name: string; api: string, auth: AlpacaAuth }) =>
  <ZQuery extends Z.ZodType<QueryParams>, ZBody extends Z.ZodType<BodyParams>, ZResponse extends Z.ZodType>(endpoint: {
    name: string;
    method: APIMethod;
    path: string;

    query: ZQuery;
    body: ZBody;
    response: ZResponse;

    okStatus: number;
    statusMessages?: Record<number, string>;
  }) =>
  async (
    payload: StripNever<{
      path?: string; // HOW use
      query: Z.input<ZQuery>;
      body: Z.input<ZBody>;
    }>
  ) => {
    const base = `https://${client.api}.alpaca.markets/`;
    const url = new URL(endpoint.path, base);
    const requestInit: RequestInit = {
      method: endpoint.method,
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": client.auth.key,
        "APCA-API-SECRET-KEY": client.auth.secret,
      },
    };

    const prepared: FetchPayload = {};
    if ("query" in payload) {
      prepared.query = endpoint.query.parse(payload.query);
      const queryEntries = Object.entries(payload.query as object);
      queryEntries.forEach(([key, value]) => url.searchParams.set(key, value?.toString() ?? ""));
    }

    if ("body" in payload) {
      prepared.body = endpoint.body.parse(payload.body);
      requestInit.headers = {
        ...requestInit.headers,
        "content-type": "application/json",
      };
      requestInit.body = JSON.stringify(payload.body);
    }

    const response = await fetch(url, requestInit);
    if (response.status === endpoint.okStatus) return endpoint.response.parse(await response.json());
    throw new Error(
      endpoint.statusMessages?.[response.status] ??
        `${client.name} - ${endpoint.name}: Undocumented response ${response.status}: ${response.statusText}`
    );
  };

const _trading = _client({
  name: "Trading (Paper)",
  api: "paper-api",
  auth: { key: "", secret: "" },
});
const _clock = _trading({
  name: "Get Market Clock",
  path: "v2/clock",
  method: "GET",

  query: Z.never(),
  body: Z.never(),
  response: ClockSchema,

  okStatus: 200,
});
const clock = await _clock({});

const _export = { trading: { clock: _clock } };
