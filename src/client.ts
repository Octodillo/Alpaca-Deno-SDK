import Alpaca from "./mod.ts";
import { Z } from "./external.ts";

export abstract class ClientModule {
  constructor(protected client: AlpacaClient) {}
}

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

export abstract class AlpacaClient {
  constructor(protected alpaca: Alpaca) {}
  protected abstract baseAPI: string;

  async fetch<
    ZQuery extends Z.ZodType<QueryParams>,
    ZBody extends Z.ZodType<BodyParams>,
    ZResponse extends Z.ZodType
  >(params: {
    name: string;
    endpoint: string;
    method: APIMethod;

    querySchema: ZQuery;
    bodySchema: ZBody;
    responseSchema: ZResponse;

    okStatus: number;
    statusMessages?: Record<number, string>;

    payload?: {
      query?: Z.input<ZQuery>;
      body?: Z.input<ZBody>;
    };
  }) {
    const prepared: FetchPayload = {};
    if (params.payload?.query) prepared.query = params.querySchema.parse(params.payload.query);
    if (params.payload?.body) prepared.body = params.bodySchema.parse(params.payload.body);

    const base = `https://${this.baseAPI}.alpaca.markets/`;
    const url = new URL(params.endpoint, base);
    const response = await this.alpaca.fetch(url, params.method, prepared);
    if (response.status === params.okStatus) return params.responseSchema.parse(await response.json());

    throw new Error(
      params.statusMessages?.[response.status] ??
        `${params.name}: Undocumented response ${response.status}: ${response.statusText}`
    );
  }
}
