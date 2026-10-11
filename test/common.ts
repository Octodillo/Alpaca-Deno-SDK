import { loadSync } from "../src/external.ts";
import { Alpaca, AlpacaAuth } from "../src/client.ts";

const env = loadSync();

/** Paper trading keys from `.env`, or undefined when there are none. Live tests skip without them. */
export const auth: AlpacaAuth | undefined = env.key && env.secret ? { key: env.key, secret: env.secret } : undefined;

export const live = new Alpaca({ auth: auth ?? { key: "", secret: "" }, paper: true });

/** Opt-in for tests that create and then clean up their own state. */
export const mutating = Deno.env.get("ALPACA_MUTATING_TESTS") === "1";

export interface StubbedRequest {
  url: URL;
  method: string;
  headers: Headers;
  body: string | null;
}

/** Replaces `fetch` while `fn` runs, recording each request and answering with `respond`. */
export const withStubbedFetch = async (
  respond: (request: StubbedRequest) => Response,
  fn: (requests: StubbedRequest[]) => Promise<void>,
) => {
  const requests: StubbedRequest[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const request: StubbedRequest = {
      url: new URL(input instanceof Request ? input.url : input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : null,
    };
    requests.push(request);
    return Promise.resolve(respond(request));
  };
  try {
    await fn(requests);
  } finally {
    globalThis.fetch = original;
  }
};

export const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
