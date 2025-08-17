import { Z } from "../external.ts";
import TradingClient from "./mod.ts";
import {
  CreateOrderBody,
  Order,
  CreateOrderBodySchema,
  OrderSchema,
  OrdersQuery,
  OrdersQuerySchema,
  OrdersQueryResponseSchema,
  DeleteAllOrdersResponse,
  DeleteAllOrdersResponseSchema,
} from "./schemas.ts";

export default (client: TradingClient) => ({
  create: (body: CreateOrderBody): Promise<Order> =>
    client.fetch({
      name: "Create Order",
      endpoint: "v2/orders",
      method: "POST",

      querySchema: Z.never(),
      bodySchema: CreateOrderBodySchema,
      responseSchema: OrderSchema,

      okStatus: 200,
      statusMessages: {
        403: "Create Order: 403 Buying power or shares is not sufficient",
        422: "Create Order: 422 Input parameters are not recognized",
      },

      payload: { body },
    }),

  search: (query: OrdersQuery): Promise<Order[]> =>
    client.fetch({
      name: "Get Orders",
      endpoint: "v2/orders",
      method: "GET",

      querySchema: OrdersQuerySchema,
      bodySchema: Z.never(),
      responseSchema: OrdersQueryResponseSchema,

      okStatus: 200,

      payload: { query },
    }),

  deleteAll: (): Promise<DeleteAllOrdersResponse> =>
    client
      .fetch({
        name: "Delete All Orders",
        endpoint: "v2/orders",
        method: "DELETE",

        querySchema: Z.never(),
        bodySchema: Z.never(),
        responseSchema: DeleteAllOrdersResponseSchema,

        okStatus: 207,
      })
      .then(parsed => {
        const errors = parsed
          .filter(order => order.status !== 200)
          .map(order => new Error(`Delete All Orders: Failed to delete order ${order.id}: ${order.status}`));
        if (errors) throw new AggregateError(errors, "Delete All Orders: Some orders failed to delete");

        return parsed;
      }),

  getByClientID: (client_order_id: string): Promise<Order> =>
    client.fetch({
      name: "Get Order by Client ID",
      endpoint: "v2/orders:by_client_order_id",
      method: "GET",

      querySchema: Z.object({ client_order_id: Z.string().max(128) }).strict(),
      bodySchema: Z.never(),
      responseSchema: OrderSchema,

      okStatus: 200,

      payload: { query: { client_order_id } },
    }),

  get: (order_id: string, nested?: boolean): Promise<Order> =>
    client.fetch({
      name: "Get Order",
      endpoint: `v2/orders/${order_id}`,
      method: "GET",

      querySchema: Z.object({ nested: Z.boolean().optional() }).strict(),
      bodySchema: Z.never(),
      responseSchema: OrderSchema,

      okStatus: 200,

      payload: { query: { nested } },
    }),

  delete: (order_id: string): Promise<void> =>
    client.fetch({
      name: "Delete Order",
      endpoint: `v2/orders/${order_id}`,
      method: "DELETE",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.never(),

      okStatus: 204,
      statusMessages: {
        422: "Delete Order: 422 The order status is not cancelable",
      },
    }),
});
