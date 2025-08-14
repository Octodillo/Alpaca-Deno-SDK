import { ClientModule } from "../client.ts";
import { Z } from "../external.ts";
import { AssetClassSchema } from "./instruments.ts";
import { AlpacaDateTimeSchema } from "./time.ts";

export const OrderClassSchema = Z.enum(["simple", "bracket", "oco", "oto", "mleg"]);

export const OrderSideSchema = Z.enum(["buy", "sell"]);

export const OrderTypeSchema = Z.enum(["market", "limit", "stop", "stop_limit", "trailing_stop"]);

export const TimeInForceSchema = Z.enum(["day", "gtc", "opg", "cls", "ioc", "fok"]);

export const PositionIntentSchema = Z.enum(["buy_to_open", "buy_to_close", "sell_to_open", "sell_to_close"]);

export const OrderQueryStatusSchema = Z.enum(["open", "closed"]);

export const OrderQueryDirectionSchema = Z.enum(["asc", "desc"]);

export const OrderStatusSchema = Z.enum([
  "new",
  "partially_filled",
  "filled",
  "done_for_day",
  "canceled",
  "expired",
  "replaced",
  "pending_cancel",
  "pending_replace",
  "accepted",
  "pending_new",
  "accepted_for_bidding",
  "stopped",
  "rejected",
  "suspended",
  "calculated",
]);

// TODO define
export const OrderLegSchema = Z.unknown();
export const OrderTakeProfitSchema = Z.unknown();
export const OrderStopLossSchema = Z.unknown();

export const OrderSchema = Z.object({
  id: Z.string().optional(),
  client_order_id: Z.string().max(128).optional(),
  created_at: AlpacaDateTimeSchema.optional(),
  updated_at: AlpacaDateTimeSchema.nullable().optional(),
  submitted_at: AlpacaDateTimeSchema.nullable().optional(),
  filled_at: AlpacaDateTimeSchema.nullable().optional(),
  expired_at: AlpacaDateTimeSchema.nullable().optional(),
  canceled_at: AlpacaDateTimeSchema.nullable().optional(),
  failed_at: AlpacaDateTimeSchema.nullable().optional(),
  replaced_at: AlpacaDateTimeSchema.nullable().optional(),
  replaced_by: Z.uuid().nullable().optional(),
  replaces: Z.uuid().nullable().optional(),
  asset_id: Z.uuid().optional(),
  symbol: Z.string().min(1).optional(),
  asset_class: AssetClassSchema.optional(),
  notional: Z.coerce.number().nullable(), // deprecated, see qty
  qty: Z.coerce.number().nullable(),
  filled_qty: Z.coerce.number().optional(),
  filled_avg_price: Z.coerce.number().nullable().optional(),
  order_class: OrderClassSchema.optional(),
  order_type: OrderTypeSchema.optional(), // deprecated, see type
  type: OrderTypeSchema,
  side: OrderSideSchema.optional(),
  time_in_force: TimeInForceSchema,
  limit_price: Z.coerce.number().nullable().optional(),
  stop_price: Z.coerce.number().nullable().optional(),
  status: OrderStatusSchema.optional(),
  extended_hours: Z.boolean().optional(),
  legs: OrderLegSchema.array().max(4).nullable().optional(),
  trail_percent: Z.coerce.number().nullable().optional(),
  trail_price: Z.coerce.number().nullable().optional(),
  hwm: Z.coerce.number().nullable().optional(),
  position_intent: PositionIntentSchema.optional(),
});

export type Order = Z.infer<typeof OrderSchema>;

// TODO differentiate shapes
export const CreateOrderBodySchema = Z.object({
  symbol: Z.string().optional(),
  qty: Z.number().transform(String).optional(),
  notional: Z.number().transform(String).optional(),
  side: OrderSideSchema.optional(),
  type: OrderTypeSchema,
  time_in_force: TimeInForceSchema,
  limit_price: Z.number().transform(String).optional(),
  stop_price: Z.number().transform(String).optional(),
  trail_price: Z.number().transform(String).optional(),
  trail_percent: Z.number().transform(String).optional(),
  extended_hours: Z.boolean().optional(),
  client_order_id: Z.uuid().optional(),
  order_class: OrderClassSchema.optional(),
  legs: OrderLegSchema.array().max(4).optional(),
  take_profit: OrderTakeProfitSchema.optional(),
  stop_loss: OrderStopLossSchema.optional(),
  position_intent: PositionIntentSchema.optional(),
}).strict();

export type CreateOrderBody = Z.input<typeof CreateOrderBodySchema>;

export const OrdersQuerySchema = Z.object({
  status: OrderQueryStatusSchema.optional(),
  limit: Z.number().int().max(10000).transform(String).optional(),
  after: AlpacaDateTimeSchema.optional(),
  until: AlpacaDateTimeSchema.optional(),
  direction: OrderQueryDirectionSchema.optional(),
  nested: Z.boolean().optional(),
  symbols: Z.string()
    .array()
    .transform(a => a.join(","))
    .optional(),
  side: OrderSideSchema.optional(),
  asset_class: AssetClassSchema.array()
    .transform(a => a.join(","))
    .optional(),
}).strict();

export type OrdersQuery = Z.input<typeof OrdersQuerySchema>;

export const OrdersQueryResponseSchema = OrderSchema.array();
export type OrdersQueryResponse = Z.infer<typeof OrdersQueryResponseSchema>;

export const DeleteAllOrdersResponseSchema = Z.object({
  id: Z.uuid(),
  status: Z.int(),
})
  .strict()
  .array();

export type DeleteAllOrdersResponse = Z.infer<typeof DeleteAllOrdersResponseSchema>;

export default class TradingOrdersModule extends ClientModule {
  create(body: CreateOrderBody): Promise<Order> {
    return this.client.fetch({
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
    });
  }

  search(query: OrdersQuery): Promise<Order[]> {
    return this.client.fetch({
      name: "Get Orders",
      endpoint: "v2/orders",
      method: "GET",

      querySchema: OrdersQuerySchema,
      bodySchema: Z.never(),
      responseSchema: OrdersQueryResponseSchema,

      okStatus: 200,
      statusMessages: {},

      payload: { query },
    });
  }

  deleteAll(): Promise<DeleteAllOrdersResponse> {
    return this.client
      .fetch({
        name: "Delete All Orders",
        endpoint: "v2/orders",
        method: "DELETE",

        querySchema: Z.never(),
        bodySchema: Z.never(),
        responseSchema: DeleteAllOrdersResponseSchema,

        okStatus: 207,
        statusMessages: {},

        payload: {},
      })
      .then(parsed => {
        const errors = parsed
          .filter(order => order.status !== 200)
          .map(order => new Error(`Delete All Orders: Failed to delete order ${order.id}: ${order.status}`));
        if (errors) throw new AggregateError(errors, "Delete All Orders: Some orders failed to delete");

        return parsed;
      });
  }

  getByClientID(client_order_id: string): Promise<Order> {
    return this.client.fetch({
      name: "Get Order by Client ID",
      endpoint: "v2/orders:by_client_order_id",
      method: "GET",

      querySchema: Z.object({ client_order_id: Z.string().max(128) }).strict(),
      bodySchema: Z.never(),
      responseSchema: OrderSchema,

      okStatus: 200,
      statusMessages: {},

      payload: { query: { client_order_id } },
    });
  }

  get(order_id: string, nested?: boolean): Promise<Order> {
    return this.client.fetch({
      name: "Get Order",
      endpoint: `v2/orders/${order_id}`,
      method: "GET",

      querySchema: Z.object({ nested: Z.boolean().optional() }).strict(),
      bodySchema: Z.never(),
      responseSchema: OrderSchema,

      okStatus: 200,
      statusMessages: {},

      payload: { query: { nested } },
    });
  }

  delete(order_id: string): Promise<void> {
    return this.client.fetch({
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

      payload: {},
    });
  }
}
