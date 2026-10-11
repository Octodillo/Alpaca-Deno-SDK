/** A non-2xx (or otherwise unexpected) response from Alpaca. */
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
