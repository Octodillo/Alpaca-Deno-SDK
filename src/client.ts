import { Z } from "./external.ts";
import { AlpacaError } from "./errors.ts";
import { tradingEndpoints } from "./trading/mod.ts";
import { marketEndpoints } from "./market/mod.ts";
import { brokerEndpoints } from "./broker/mod.ts";

export { AlpacaError };

export type APIMethod = "GET" | "OPTIONS" | "PUT" | "DELETE" | "POST" | "PATCH";
export type PathParams = Record<string, string | number>;
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;
export type HeaderParams = Record<string, string | undefined>;

export interface AlpacaAuth {
  key: string;
  secret: string;
}

export interface AlpacaConfig {
  auth: AlpacaAuth;
  /** Paper trading / sandbox hosts. Defaults to true. */
  paper?: boolean;
  /** Broker API keys (HTTP Basic auth) rather than trading API keys. Defaults to false. */
  broker?: boolean;
}

export type API = "trading" | "data" | "broker";

/**
 * Static description of a single API endpoint. Holds no auth or environment. Declare with
 * `satisfies Endpoint`, not a type annotation, so the specific schemas survive for `Payload` and `Response`.
 */
export interface Endpoint {
  name: string;
  api: API;
  method: APIMethod;
  /** Relative to the API host, with `{name}` placeholders filled from `params`. */
  path: string;

  params: Z.ZodType<PathParams>;
  query: Z.ZodType<QueryParams>;
  headers?: Z.ZodType<HeaderParams>;
  body: Z.ZodType;
  response: Z.ZodType;

  okStatus: number | number[];
  statusMessages?: Record<number, string>;

  /** Maps friendlier call arguments onto the payload. Without it, callers pass the payload. */
  // Method syntax, so any parameter list is assignable; `Checked` enforces the real signature
  args?(...args: unknown[]): unknown;
}

type Parts<E extends Endpoint> = {
  params: Z.input<E["params"]>;
  query: Z.input<E["query"]>;
  headers: E extends { headers: infer H extends Z.ZodType } ? Z.input<H> : never;
  body: Z.input<E["body"]>;
};

// Parts whose schema is `Z.never()` are banned; parts that accept `{}` or `undefined` are optional
type Empty = Record<never, never>;
type IsOptional<V> = undefined extends V ? true : Empty extends V ? true : false;
type RequiredParts<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : IsOptional<T[K]> extends true ? never : K]: T[K];
};
type OptionalParts<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : IsOptional<T[K]> extends true ? K : never]?: T[K];
};
type BannedParts<T> = { [K in keyof T as [T[K]] extends [never] ? K : never]?: never };
type Simplify<T> = { [K in keyof T]: T[K] } & Empty;

export type Payload<E extends Endpoint> = Simplify<
  RequiredParts<Parts<E>> & OptionalParts<Parts<E>> & BannedParts<Parts<E>>
>;

export type Response<E extends Endpoint> = Z.output<E["response"]>;

export type Args<E extends Endpoint> = E extends { args: (...args: infer A) => unknown } ? A
  : Empty extends Payload<E> ? [payload?: Payload<E>]
  : [payload: Payload<E>];

/** Rejects endpoints whose `args` doesn't produce that endpoint's own payload. */
export type Checked<E extends Endpoint> = E & { args?: (...args: never[]) => Payload<E> };

// Namespaces are plain data: nested objects of endpoint definitions. These swap each endpoint in a
// tree for `client.bind(endpoint)`.
type Bound<T> = {
  [K in keyof T]: T[K] extends Endpoint ? (...args: Args<T[K]>) => Promise<Response<T[K]>> : Bound<T[K]>;
};

/** A namespace tree in which every endpoint's `args` produces that endpoint's own payload. */
type CheckedTree<T> = { [K in keyof T]: T[K] extends Endpoint ? Checked<T[K]> : CheckedTree<T[K]> };

// Never name a namespace key `okStatus`
const isEndpoint = (value: object): value is Checked<Endpoint> => "okStatus" in value;

const bindTree = (client: Alpaca, tree: object): object =>
  Object.fromEntries(
    Object.entries(tree).map(([key, value]) => [key, isEndpoint(value) ? client.bind(value) : bindTree(client, value)]),
  );

const bindAll = <T extends object>(client: Alpaca, tree: T & CheckedTree<T>) => bindTree(client, tree) as Bound<T>;

const hosts = {
  trading: { paper: "paper-api", live: "api" },
  broker: { paper: "broker-api.sandbox", live: "broker-api" },
  // Market data has a sandbox only for broker keys; trading keys always use `data`
  data: { paper: "data", live: "data" },
  brokerData: { paper: "data.sandbox", live: "data" },
};

const isVoid = (schema: Z.ZodType) => schema instanceof Z.ZodVoid || schema instanceof Z.ZodUndefined;

/** Holds auth and environment, and sends requests. */
export class Alpaca {
  readonly auth: AlpacaAuth;
  readonly paper: boolean;
  // Not `broker`: that's the broker namespace
  readonly #brokerKeys: boolean;

  constructor(config: AlpacaConfig) {
    this.auth = config.auth;
    this.paper = config.paper ?? true;
    this.#brokerKeys = config.broker ?? false;
  }

  // Arrow properties, so `const { request } = client` keeps working
  request = <E extends Endpoint>(endpoint: Checked<E>, ...args: Args<E>): Promise<Response<E>> =>
    this.#send(endpoint, (endpoint.args ? endpoint.args(...args) : (args[0] ?? {})) as Payload<E>);

  /** Turns an endpoint definition into a plain async function. */
  bind = <E extends Endpoint>(endpoint: Checked<E>) => (...args: Args<E>): Promise<Response<E>> =>
    this.request(endpoint, ...args);

  // Declared after `bind`, which they use while initializing. Must not be named `request`, `bind`,
  // `auth` or `paper`.
  readonly trading = bindAll(this, tradingEndpoints);
  readonly market = bindAll(this, marketEndpoints);
  readonly broker = bindAll(this, brokerEndpoints);

  async #send<E extends Endpoint>(endpoint: E, payload: Payload<E>): Promise<Response<E>> {
    const parts = payload as Partial<Record<keyof Parts<E>, unknown>>;
    // `args` may set an optional part to undefined, which means leaving it out
    const has = (part: keyof Parts<E>) => parts[part] !== undefined;
    const params: PathParams = has("params") ? endpoint.params.parse(parts.params) : {};
    const path = endpoint.path.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = params[key];
      if (value === undefined || value === null || value === "") {
        throw new TypeError(`${endpoint.name}: Missing path parameter ${key}`);
      }
      // URL parsing resolves dot segments, percent-encoded or not, which would turn a request for
      // one item into a request to its collection (`DELETE v2/orders/.` is cancel-all)
      if (value === "." || value === "..") {
        throw new TypeError(`${endpoint.name}: Invalid path parameter ${key}: ${JSON.stringify(value)}`);
      }
      return encodeURIComponent(value);
    });

    const host = this.#host(endpoint.api);
    const url = new URL(path, `https://${host}.alpaca.markets/`);
    const headers: Record<string, string> = { accept: "application/json", ...this.#authHeaders(endpoint.api) };
    const requestInit: RequestInit = { method: endpoint.method, headers };

    if (has("query")) {
      const query = endpoint.query.parse(parts.query);
      Object.entries(query).forEach(([key, value]) => {
        const values = (Array.isArray(value) ? value : [value]).filter((v) => v !== undefined && v !== null);
        if (values.length) url.searchParams.set(key, values.join(","));
      });
    }

    if (has("headers") && endpoint.headers) {
      Object.entries(endpoint.headers.parse(parts.headers)).forEach(([key, value]) => {
        if (value !== undefined) headers[key] = value;
      });
    }

    if (has("body")) {
      headers["content-type"] = "application/json";
      requestInit.body = JSON.stringify(endpoint.body.parse(parts.body));
    }

    const response = await fetch(url, requestInit);
    const ok = Array.isArray(endpoint.okStatus)
      ? endpoint.okStatus.includes(response.status)
      : response.status === endpoint.okStatus;

    if (ok && (response.status === 204 || isVoid(endpoint.response))) {
      await response.body?.cancel();
      return endpoint.response.parse(undefined) as Response<E>;
    }
    if (ok) return endpoint.response.parse(await response.json()) as Response<E>;

    const text = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
    const apiMessage =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : undefined;
    throw new AlpacaError(
      endpoint.statusMessages?.[response.status] ??
        `${endpoint.name}: ${response.status} ${apiMessage ?? (response.statusText || "Unexpected response")}`,
      response.status,
      endpoint.name,
      body,
    );
  }

  #host(api: API) {
    const kind = api === "data" && this.#brokerKeys ? "brokerData" : api;
    return hosts[kind][this.paper ? "paper" : "live"];
  }

  /** The broker API takes only HTTP Basic auth; market data takes either, and gets Basic with broker keys. */
  #authHeaders(api: API): Record<string, string> {
    if (api === "broker" || (api === "data" && this.#brokerKeys)) {
      return { authorization: `Basic ${btoa(`${this.auth.key}:${this.auth.secret}`)}` };
    }
    return { "APCA-API-KEY-ID": this.auth.key, "APCA-API-SECRET-KEY": this.auth.secret };
  }
}
