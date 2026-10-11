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
