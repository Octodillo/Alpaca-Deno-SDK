// Type-level tests. Each `@ts-expect-error` marks something the design must reject, so `deno check`
// passes only while every one of them is still a type error. Nothing here sends a request.
import { Z } from "../src/external.ts";
import { Alpaca, Endpoint, Response } from "../src/client.ts";

const client = new Alpaca({ auth: { key: "", secret: "" } });

const getWidget = {
  name: "Get Widget",
  api: "trading",
  method: "GET",
  path: "v2/widgets/{widget_id}",

  params: Z.object({ widget_id: Z.string() }),
  query: Z.object({ side: Z.enum(["buy", "sell"]).optional() }),
  body: Z.never(),
  response: Z.object({ id: Z.string() }),

  okStatus: 200,

  args: (widget_id: string) => ({ params: { widget_id } }),
} satisfies Endpoint;

const listWidgets = {
  name: "List Widgets",
  api: "trading",
  method: "GET",
  path: "v2/widgets",

  params: Z.never(),
  query: Z.object({ side: Z.enum(["buy", "sell"]).optional() }),
  body: Z.never(),
  response: Z.object({ id: Z.string() }).array(),

  okStatus: 200,
} satisfies Endpoint;

const deleteWidget = {
  name: "Delete Widget",
  api: "trading",
  method: "DELETE",
  path: "v2/widgets/{widget_id}",

  params: Z.object({ widget_id: Z.string() }),
  query: Z.never(),
  body: Z.never(),
  response: Z.void(),

  okStatus: 204,
} satisfies Endpoint;

const badArgs = {
  ...getWidget,
  args: (widget_id: number) => ({ params: { widget: widget_id } }),
};

type IsUnknown<T> = unknown extends T ? true : false;

export const typeTests = async () => {
  // Accepted forms, for contrast with the rejections below
  const widget: { id: string } = await client.request(getWidget, "w1");
  const widgets: { id: string }[] = await client.request(listWidgets);
  await client.request(listWidgets, { query: { side: "buy" } });
  await client.request(deleteWidget, { params: { widget_id: "w1" } });
  const responseIsTyped: IsUnknown<Response<typeof getWidget>> = false;

  // @ts-expect-error: wrong `args` type
  await client.request(getWidget, 42);

  // @ts-expect-error: invalid enum value
  await client.request(listWidgets, { query: { side: "hold" } });

  // @ts-expect-error: query on a no-query endpoint
  await client.request(deleteWidget, { params: { widget_id: "w1" }, query: { force: true } });

  // @ts-expect-error: missing path param
  await client.request(deleteWidget, {});

  // @ts-expect-error: missing path param, inside `params`
  await client.request(deleteWidget, { params: {} });

  // @ts-expect-error: missing body on a generated endpoint whose spec doesn't mark it required
  await client.trading.watchlists.addByID({ params: { watchlist_id: "w1" } });

  // @ts-expect-error: `args` returns a payload that isn't this endpoint's own
  await client.request(badArgs, 1);

  // @ts-expect-error: `args` returns a payload that isn't this endpoint's own, through `bind`
  client.bind(badArgs);

  // An `: Endpoint` annotation widens the type and loses the response schema
  const widened: Endpoint = getWidget;
  const lost: IsUnknown<Response<typeof widened>> = true;
  // @ts-expect-error: the widened response is `unknown`, so its fields are gone
  (await client.request(widened)).id;

  return { widget, widgets, responseIsTyped, lost };
};
