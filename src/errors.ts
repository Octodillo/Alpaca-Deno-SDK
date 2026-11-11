/** A non-2xx response from Alpaca. */
export class AlpacaError extends Error {
  override name = "AlpacaError";

  constructor(
    message: string,
    readonly status: number,
    /** The endpoint's `name`. */
    readonly endpoint: string,
    /** The parsed response body when it was JSON. Alpaca's errors are `{ code, message }`. */
    readonly body?: unknown,
  ) {
    super(message);
  }
}

/**
 * A 2xx response whose body isn't what the endpoint declares. The request itself succeeded: an
 * order was placed, a transfer created. Don't retry it as if it had failed; `body` holds what Alpaca
 * sent (parsed JSON, or the raw text when it wasn't JSON) and `cause` the `ZodError` or `SyntaxError`.
 */
export class AlpacaResponseError extends AlpacaError {
  override name = "AlpacaResponseError";

  constructor(status: number, endpoint: string, body: unknown, cause: unknown) {
    super(
      `${endpoint}: ${status} response doesn't match the endpoint's schema (the request itself succeeded)`,
      status,
      endpoint,
      body,
    );
    this.cause = cause;
  }
}

/**
 * A 207 response reports one status per item. Turns the failed items into an `AggregateError` of
 * `AlpacaError`s, so a partial failure can't pass unnoticed.
 */
export const failOnPartial =
  <Item extends { status?: number }>(name: string, describe: (item: Item) => string) => (items: Item[]) => {
    const failures = items.filter((item) => item.status !== 200);
    if (!failures.length) return items;
    throw new AggregateError(
      failures.map((item) =>
        new AlpacaError(`${name}: ${describe(item)}: ${item.status}`, item.status ?? 0, name, item)
      ),
      `${name}: ${failures.length} of ${items.length} failed`,
    );
  };
