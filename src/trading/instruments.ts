import { ClientModule } from "../client.ts";
import { ExchangeSchema } from "../common.ts";
import { Z } from "../external.ts";
import { Order, OrderSchema, OrderSideSchema } from "./orders.ts";
import { AlpacaDateSchema } from "./time.ts";

export const AssetClassSchema = Z.enum(["us_equity", "us_option", "crypto"]);
const ActiveStatusSchema = Z.enum(["active", "inactive", "suspended", "delisted"]);
const AssetAttributeSchema = Z.enum([
  "ptp_no_exception",
  "ptp_with_exception",
  "ipo",
  "has_options",
  "options_late_close",
]);

export type Asset = Z.infer<typeof AssetSchema>;
export const AssetSchema = Z.object({
  id: Z.uuid(),
  class: AssetClassSchema,
  cusip: Z.string().nullable().optional(),
  exchange: ExchangeSchema,
  symbol: Z.string(),
  name: Z.string().regex(/.+/),
  status: ActiveStatusSchema,
  tradable: Z.boolean(),
  marginable: Z.boolean(),
  shortable: Z.boolean(),
  easy_to_borrow: Z.boolean(),
  fractionable: Z.boolean(),
  maintenance_margin_requirement: Z.number().optional(), // deprecated, see margin_requirement_long or margin_requirement_short
  margin_requirement_long: Z.coerce.number().optional(),
  margin_requirement_short: Z.coerce.number().optional(),
  attributes: AssetAttributeSchema.array().optional(),
}).strict();

type AssetsQuery = Z.input<typeof AssetsQuerySchema>;
const AssetsQuerySchema = Z.object({
  status: ActiveStatusSchema.optional(),
  asset_class: AssetClassSchema.optional(),
  exchange: ExchangeSchema.optional(),
  attributes: AssetAttributeSchema.array()
    .transform(arr => arr.join(","))
    .optional(),
}).strict();

const AssetsQueryResponseSchema = AssetSchema.array();

class AssetsModule extends ClientModule {
  get(symbol_or_asset_id: string): Promise<Asset> {
    return this.client.fetch({
      name: "Get Asset",
      endpoint: `v2/assets/${symbol_or_asset_id}`,
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: AssetSchema,

      okStatus: 200,
      statusMessages: {
        404: `Asset Not Found: ${symbol_or_asset_id}`,
      },

      payload: {},
    });
  }

  all(query: AssetsQuery): Promise<Asset[]> {
    return this.client.fetch({
      name: "Get Assets",
      endpoint: "v2/assets",
      method: "GET",

      querySchema: AssetsQuerySchema,
      bodySchema: Z.never(),
      responseSchema: AssetsQueryResponseSchema,

      okStatus: 200,
      statusMessages: {},

      payload: { query },
    });
  }
}

class CryptoModule extends ClientModule {
  _foo() {}
}

const DeliverableTypeSchema = Z.enum(["cash", "equity"]);
const DeliverableSettlementMethodSchema = Z.enum(["BTOB", "CADF", "CAFX", "CCC"]);
const DeliverableSettlementTypeSchema = Z.enum(["T+0", "T+1", "T+2", "T+3", "T+4", "T+5"]);
const ContractTypeSchema = Z.enum(["call", "put"]);
const ContractStyleSchema = Z.enum(["american", "european"]);

export type Deliverable = Z.infer<typeof DeliverableSchema>;
const DeliverableSchema = Z.object({
  type: DeliverableTypeSchema,
  symbol: Z.string(),
  asset_id: Z.uuid().optional(),
  amount: Z.coerce.number(),
  allocation_percentage: Z.coerce.number(),
  settlement_type: DeliverableSettlementTypeSchema,
  settlement_method: DeliverableSettlementMethodSchema,
  delayed_settlement: Z.boolean(),
}).strict();

export type OptionContract = Z.infer<typeof OptionContractSchema>;
const OptionContractSchema = Z.object({
  id: Z.uuid(),
  symbol: Z.string(),
  name: Z.string(),
  status: ActiveStatusSchema,
  tradable: Z.boolean(),
  expiration_date: AlpacaDateSchema,
  root_symbol: Z.string().optional(),
  underlying_symbol: Z.string(),
  underlying_asset_id: Z.uuid(),
  type: ContractTypeSchema,
  style: ContractStyleSchema,
  strike_price: Z.coerce.number(),
  multiplier: Z.coerce.number(),
  size: Z.coerce.number(),
  open_interest: Z.coerce.number().optional(),
  open_interest_date: AlpacaDateSchema.optional(),
  close_price: Z.coerce.number().optional(),
  close_price_date: AlpacaDateSchema.optional(),
  deliverables: DeliverableSchema.array().optional(),
}).strict();

type OptionContractsQuery = Z.input<typeof OptionContractsQuerySchema>;
const OptionContractsQuerySchema = Z.object({
  underlying_symbols: Z.string()
    .array()
    .transform(arr => arr.join(","))
    .optional(),
  show_deliverables: Z.boolean().optional(),
  status: ActiveStatusSchema.optional(),
  expiration_date: AlpacaDateSchema.optional(),
  expiration_date_gte: AlpacaDateSchema.optional(),
  expiration_date_lte: AlpacaDateSchema.optional(),
  root_symbol: Z.string().optional(),
  type: ContractTypeSchema.optional(),
  style: ContractStyleSchema.optional(),
  strike_price_gte: Z.number().optional(),
  strike_price_lte: Z.number().optional(),
  page_token: Z.string().optional(),
  limit: Z.int().max(10000).optional(),
  ppind: Z.boolean().optional(),
}).strict();

const OptionContractsQueryResponseSchema = Z.object({
  option_contracts: OptionContractSchema.array(),
})
  .strict()
  .transform(r => r.option_contracts); // opinionated

class OptionContractsModule extends ClientModule {
  get(symbol_or_id: string): Promise<OptionContract> {
    return this.client.fetch({
      name: "Get Option Contract",
      endpoint: `v2/options/contracts/${symbol_or_id}`,
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: OptionContractSchema,

      okStatus: 200,
      statusMessages: {
        404: `Option Contract Not Found: ${symbol_or_id}`,
      },

      payload: {},
    });
  }

  all(query: OptionContractsQuery): Promise<OptionContract[]> {
    return this.client.fetch({
      name: "Get Option Contracts",
      endpoint: "v2/options/contracts",
      method: "GET",

      querySchema: OptionContractsQuerySchema,
      bodySchema: Z.never(),
      responseSchema: OptionContractsQueryResponseSchema,

      okStatus: 200,
      statusMessages: {},

      payload: { query },
    });
  }
}

const TreasurySubtypeSchema = Z.enum(["bond", "bill", "note", "strips", "tips", "floating"]);
const BondStatusSchema = Z.enum(["outstanding", "matured", "pre_issuance"]);
const CouponTypeSchema = Z.enum(["fixed", "floating", "zero"]);
const CouponFrequencySchema = Z.enum(["annual", "semi_annual", "quarterly", "monthly", "zero"]);

export type Treasury = Z.infer<typeof TreasurySchema>;
const TreasurySchema = Z.object({
  cusip: Z.string().length(12),
  isin: Z.string().length(12),
  bond_status: BondStatusSchema,
  tradable: Z.boolean(),
  subtype: TreasurySubtypeSchema,
  issue_date: AlpacaDateSchema,
  maturity_date: AlpacaDateSchema,
  description: Z.string(),
  description_short: Z.string(),
  close_price: Z.coerce.number().optional(),
  close_price_date: AlpacaDateSchema.optional(),
  close_yield_to_maturity: Z.coerce.number().optional(),
  close_yield_to_worst: Z.coerce.number().optional(),
  coupon: Z.coerce.number(),
  coupon_type: CouponTypeSchema,
  coupon_frequency: CouponFrequencySchema,
  first_coupon_date: AlpacaDateSchema.optional(),
  next_coupon_date: AlpacaDateSchema.optional(),
  last_coupon_date: AlpacaDateSchema.optional(),
}).strict();

type TreasuriesQuery = Z.input<typeof TreasuriesQuerySchema>;
const TreasuriesQuerySchema = Z.object({
  subtype: TreasurySubtypeSchema.optional(),
  bond_status: BondStatusSchema.optional(),
  cusips: Z.string()
    .length(12)
    .array()
    .max(1000)
    .transform(arr => arr.join(","))
    .optional(),
  isins: Z.string()
    .length(12)
    .array()
    .max(1000)
    .transform(arr => arr.join(","))
    .optional(),
}).strict();

const TreasuriesQueryResponseSchema = Z.object({
  us_treasuries: TreasurySchema.array(),
})
  .strict()
  .transform(r => r.us_treasuries);

class TreasuriesModule extends ClientModule {
  all(query: TreasuriesQuery): Promise<Treasury[]> {
    return this.client.fetch({
      name: "Get Treasuries",
      endpoint: "v2/treasuries",
      method: "GET",

      querySchema: TreasuriesQuerySchema,
      bodySchema: Z.never(),
      responseSchema: TreasuriesQueryResponseSchema,

      okStatus: 200,
      statusMessages: {
        400: "Bad Request",
        403: "Forbidden",
        429: "Too Many Requests",
        500: "Internal Server Error",
      },
      payload: { query },
    });
  }
}

export type Position = Z.infer<typeof PositionSchema>;
const PositionSchema = Z.object({
  asset_id: Z.uuid(),
  symbol: Z.string(),
  exchange: ExchangeSchema,
  asset_class: AssetClassSchema,
  avg_entry_price: Z.coerce.number(),
  qty: Z.coerce.number(),
  qty_available: Z.coerce.number().optional(),
  side: OrderSideSchema,
  market_value: Z.coerce.number(),
  cost_basis: Z.coerce.number(),
  unrealized_pl: Z.coerce.number(),
  unrealized_plpc: Z.coerce.number(),
  unrealized_intraday_pl: Z.coerce.number(),
  unrealized_intraday_plpc: Z.coerce.number(),
  current_price: Z.coerce.number(),
  lastday_price: Z.coerce.number(),
  change_today: Z.coerce.number(),
  asset_marginable: Z.boolean(),
});

const AllPositionsResponseSchema = PositionSchema.array();

type ClosePositionQuery = Z.input<typeof ClosePositionQuerySchema>;
const ClosePositionQuerySchema = Z.union([
  Z.object({ qty: Z.number().transform(String) }),
  Z.object({ percentage: Z.number().transform(String) }),
]);

type ClosePositionResponse = Z.infer<typeof ClosePositionResponseSchema>;
const ClosePositionResponseSchema = Z.object({
  symbol: Z.string(),
  status: Z.number(),
  body: OrderSchema,
});

const CloseAllPositionsResponseSchema = ClosePositionResponseSchema.array();

class PositionsModule extends ClientModule {
  all(): Promise<Position[]> {
    return this.client.fetch({
      name: "Get All Positions",
      endpoint: "v2/positions",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: AllPositionsResponseSchema,

      okStatus: 200,
      statusMessages: {},

      payload: {},
    });
  }

  closeAll(cancel_orders = false): Promise<ClosePositionResponse[]> {
    return this.client
      .fetch({
        name: "Close All Positions",
        endpoint: "v2/positions",
        method: "DELETE",

        querySchema: Z.object({ cancel_orders: Z.boolean().optional() }),
        bodySchema: Z.never(),
        responseSchema: CloseAllPositionsResponseSchema,

        okStatus: 207,
        statusMessages: {
          500: "Close All Positions: Failed to liquedate",
        },

        payload: { query: { cancel_orders } },
      })
      .then(parsed => {
        const errors = parsed
          .filter(r => r.status !== 200)
          .map(r => new Error(`Close All Positions: Failed to close ${r.symbol}: ${r.status}`));
        if (errors.length) throw new AggregateError(errors);
        return parsed;
      });
  }

  get(symbol_or_asset_id: string): Promise<Position> {
    return this.client.fetch({
      name: "Get Position",
      endpoint: `v2/positions/${symbol_or_asset_id}`,
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: PositionSchema,

      okStatus: 200,
      statusMessages: {},

      payload: {},
    });
  }

  close(symbol_or_asset_id: string, query: ClosePositionQuery): Promise<Order> {
    return this.client.fetch({
      name: "Close Position",
      endpoint: `v2/positions/${symbol_or_asset_id}`,
      method: "DELETE",

      querySchema: ClosePositionQuerySchema,
      bodySchema: Z.never(),
      responseSchema: OrderSchema,

      okStatus: 200,
      statusMessages: {},

      payload: { query },
    });
  }

  exercise(symbol_or_contract_id: string): Promise<void> {
    return this.client.fetch({
      name: "Exercise Options Position",
      endpoint: `v2/positions/${symbol_or_contract_id}/exercise`,
      method: "POST",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.never(),

      okStatus: 200,
      statusMessages: {
        403: "Exercise Options Position: Available position quantity is not sufficient",
        422: "Exercise Options Position: One or more parameters provided are invalid",
      },

      payload: {},
    });
  }
}

export default class TradingInstrumentsModule extends ClientModule {
  public assets = new AssetsModule(this.client);
  public crypto = new CryptoModule(this.client);
  public options = new OptionContractsModule(this.client);
  public treasuries = new TreasuriesModule(this.client);
  public positions = new PositionsModule(this.client);
}
