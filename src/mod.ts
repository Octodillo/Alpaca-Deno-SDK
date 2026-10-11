import { loadSync, Z } from "./external.ts";
import { Alpaca, AlpacaAuth, APIMethod, BodyParams, QueryParams } from "./client.ts";
import trading from "./trading/mod.ts";

export * from "./client.ts";

export interface FetchPayload {
  query?: QueryParams;
  body?: BodyParams;
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
  const client = new Alpaca({ auth, paper: config.paper });
  return {
    trading: trading(client),
    // market: market(auth),
    // broker: broker(auth),
  };
};

export const endpoint = async <
  ZQuery extends Z.ZodType<QueryParams>,
  ZBody extends Z.ZodType<BodyParams>,
  ZResponse extends Z.ZodType,
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
      `${params.name}: Undocumented response ${response.status}: ${response.statusText}`,
  );
};
