import { Z } from "./external.ts";

export type APIMethod = "GET" | "OPTIONS" | "PUT" | "DELETE" | "POST" | "PATCH";
export type QueryParams = Record<string, string | number | boolean | null>;
export type BodyParams = Record<string, unknown>;

export interface AlpacaAuth {
  key: string;
  secret: string;
}

export type API = "trading" | "data" | "broker";

const hosts: Record<API, { paper: string; live: string }> = {
  trading: { paper: "paper-api", live: "api" },
  data: { paper: "data", live: "data" },
  broker: { paper: "broker-api.sandbox", live: "broker-api" },
};

type StripNever<T> =
  & {
    [K in keyof T as [T[K]] extends [never] ? never : K]: T[K];
  }
  & {
    [K in keyof T as [T[K]] extends [never] ? K : never]?: never;
  };

/**
 * Static description of a single API endpoint. Holds no auth or environment, so definitions
 * can be imported individually and tree-shaken. Declare with `satisfies Endpoint`, not a
 * type annotation, so the specific schemas survive for `Payload` and `Response`.
 */
export interface Endpoint<
  Path extends string | ((param: string) => string) = string | ((param: string) => string),
  ZQuery extends Z.ZodType<QueryParams> = Z.ZodType<QueryParams>,
  ZBody extends Z.ZodType<BodyParams> = Z.ZodType<BodyParams>,
  ZResponse extends Z.ZodType = Z.ZodType,
> {
  name: string;
  api: API;
  method: APIMethod;
  path: Path;

  query: ZQuery;
  body: ZBody;
  response: ZResponse;

  okStatus: number;
  statusMessages?: Record<number, string>;

  /** Maps friendlier call arguments onto the payload. Without it, callers pass the payload. */
  // Method syntax, so any parameter list is assignable; `Checked` enforces the real signature
  args?(...args: unknown[]): unknown;
}

export type Payload<E extends Endpoint> = StripNever<{
  path: E["path"] extends string ? never : string;
  query: Z.input<E["query"]>;
  body: Z.input<E["body"]>;
}>;

export type Response<E extends Endpoint> = Z.output<E["response"]>;

export type Args<E extends Endpoint> = E extends { args: (...args: infer A) => unknown } ? A
  : {} extends Payload<E> ? [payload?: Payload<E>]
  : [payload: Payload<E>];

/** Rejects endpoints whose `args` doesn't produce that endpoint's own payload. */
export type Checked<E extends Endpoint> = E & { args?: (...args: never[]) => Payload<E> };

/**
 * Holds auth and environment, and sends requests. Endpoints are imported separately and passed
 * in, so only the ones a caller uses end up in their bundle.
 */
export class Alpaca {
  readonly auth: AlpacaAuth;
  readonly paper: boolean;

  constructor(config: { auth: AlpacaAuth; paper?: boolean }) {
    this.auth = config.auth;
    this.paper = config.paper ?? true;
  }

  // Arrow properties, so `const { request } = client` keeps working
  request = <E extends Endpoint>(endpoint: Checked<E>, ...args: Args<E>): Promise<Response<E>> =>
    this.#send(endpoint, (endpoint.args ? endpoint.args(...args) : (args[0] ?? {})) as Payload<E>);

  /** Turns an endpoint definition into a plain async function. */
  bind = <E extends Endpoint>(endpoint: Checked<E>) => (...args: Args<E>): Promise<Response<E>> =>
    this.request(endpoint, ...args);

  async #send<E extends Endpoint>(endpoint: E, payload: Payload<E>): Promise<Response<E>> {
    const resolvePath = () => {
      if (typeof endpoint.path === "string") return endpoint.path;
      if ("path" in payload && typeof payload.path === "string") return endpoint.path(payload.path);
      throw new TypeError(`${endpoint.name}: Missing path parameter`);
    };
    const host = hosts[endpoint.api][this.paper ? "paper" : "live"];
    const url = new URL(resolvePath(), `https://${host}.alpaca.markets/`);
    const headers: Record<string, string> = {
      accept: "application/json",
      "APCA-API-KEY-ID": this.auth.key,
      "APCA-API-SECRET-KEY": this.auth.secret,
    };
    const requestInit: RequestInit = { method: endpoint.method, headers };

    if ("query" in payload) {
      const query = endpoint.query.parse(payload.query);
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value.toString());
      });
    }

    if ("body" in payload) {
      headers["content-type"] = "application/json";
      requestInit.body = JSON.stringify(endpoint.body.parse(payload.body));
    }

    const response = await fetch(url, requestInit);
    if (response.status === endpoint.okStatus) return endpoint.response.parse(await response.json()) as Response<E>;
    await response.body?.cancel();
    throw new Error(
      endpoint.statusMessages?.[response.status] ??
        `${endpoint.name}: Undocumented response ${response.status}: ${response.statusText}`,
    );
  }
}
