import { Z } from "../external.ts";

export const AlpacaDateSchema = Z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const AlpacaTimeSchema = Z.string().regex(/^\d{2}:\d{2}$/);
export const AlpacaDateTimeSchema = Z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/);

/**
 * The various possible account status values.
 *
 * Most likely, the account status is ACTIVE unless there is any problem. The account status may get in ACCOUNT_UPDATED when personal information is being updated from the dashboard, in which case you may not be allowed trading for a short period of time until the change is approved.
 *
 * - ONBOARDING: The account is onboarding
 * - SUBMISSION_FAILED: The account application submission failed for some reason
 * - SUBMITTED: The account application has been submitted for review
 * - ACCOUNT_UPDATED: The account information is being updated
 * - APPROVAL_PENDING: The final account approval is pending
 * - ACTIVE: The account is active for trading
 * - REJECTED: The account application has been rejected
 */
export const AccountStatusSchema = Z.enum([
  "ONBOARDING",
  "SUBMISSION_FAILED",
  "SUBMITTED",
  "ACCOUNT_UPDATED",
  "APPROVAL_PENDING",
  "ACTIVE",
  "REJECTED",
]);

/** The effective options trading level of the account */
export const OptionsTradingLevelSchema = Z.enum({
  disabled: 0,
  "Covered Call/Cash-Secured Put": 1,
  "Long Call/Put": 2,
  "Spreads/Straddles": 3,
});

export const AssetClassSchema = Z.enum(["us_equity", "us_option", "crypto"]);
export const ActiveStatusSchema = Z.enum(["active", "inactive", "suspended", "delisted"]);
export const AssetAttributeSchema = Z.enum([
  "ptp_no_exception",
  "ptp_with_exception",
  "ipo",
  "has_options",
  "options_late_close",
]);

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

export const HistoryPeriodSchema = Z.string().regex(/\d+[DWMA]/);
export const HistoryTimeframeSchema = Z.string().regex(/\d+(Min|[HD])]/);
export const HistoryIntradayReportingSchema = Z.enum(["market_hours", "extended_hours", "continuous"]);
export const HistoryPNLResetSchema = Z.enum(["per_day", "no_reset"]);
export const ActivityTypesSchema = Z.enum([
  "FILL",
  "TRANS",
  "MISC",
  "ACATC",
  "ACATS",
  "CFEE",
  "CSD",
  "CSW",
  "DIV",
  "DIVCGL",
  "DIVCGS",
  "DIVFEE",
  "DIVFT",
  "DIVNRA",
  "DIVROC",
  "DIVTW",
  "DIVTXEX",
  "FEE",
  "INT",
  "INTNRA",
  "INTTW",
  "JNL",
  "JNLC",
  "JNLS",
  "MA",
  "NC",
  "OPASN",
  "OPCA",
  "OPCSH",
  "OPEXC",
  "OPEXP",
  "OPTRD",
  "PTC",
  "PTR",
  "REORG",
  "SPIN",
  "SPLIT",
]);

export const TradeConfirmEmailSchema = Z.enum(["all", "none"]);

export const HistoryCashflowTypesSchema = Z.union([ActivityTypesSchema, Z.enum(["ALL", "NONE"])]);

export const DeliverableTypeSchema = Z.enum(["cash", "equity"]);
export const DeliverableSettlementMethodSchema = Z.enum(["BTOB", "CADF", "CAFX", "CCC"]);
export const DeliverableSettlementTypeSchema = Z.enum(["T+0", "T+1", "T+2", "T+3", "T+4", "T+5"]);
export const ContractTypeSchema = Z.enum(["call", "put"]);
export const ContractStyleSchema = Z.enum(["american", "european"]);

export const TreasurySubtypeSchema = Z.enum(["bond", "bill", "note", "strips", "tips", "floating"]);
export const BondStatusSchema = Z.enum(["outstanding", "matured", "pre_issuance"]);
export const CouponTypeSchema = Z.enum(["fixed", "floating", "zero"]);
export const CouponFrequencySchema = Z.enum(["annual", "semi_annual", "quarterly", "monthly", "zero"]);

export const CalendarDateTypeSchema = Z.enum(["TRADING", "SETTLEMENT"]);

export const CurrencySchema = Z.enum(["USD", "..."]);
export const ExchangeSchema = Z.enum(["AMEX", "ARCA", "BATS", "NYSE", "NASDAQ", "NYSEARCA", "OTC"]);

export const DTBPCheckSchema = Z.enum(["both", "entry", "exit"]);

export const MaxMarginMultiplierSchema = Z.enum(["1", "2", "4"]).transform(Number);

export const PDTCheckSchema = Z.enum(["both", "entry", "exit"]);

export const MaxOptionsTradingLevelSchema = Z.union([Z.literal(0), Z.literal(1), Z.literal(2), Z.literal(3)]);

export const AccountSchema = Z.object({
  id: Z.uuid(),
  account_number: Z.string().optional(),
  status: AccountStatusSchema,
  currency: CurrencySchema.optional(),
  cash: Z.coerce.number().optional(),
  portfolio_value: Z.coerce.number().optional(), // deprecated, see `equity`
  non_marginable_buying_power: Z.coerce.number().optional(),
  accrued_fees: Z.coerce.number().optional(),
  pending_transfer_in: Z.coerce.number().optional(),
  pending_transfer_out: Z.coerce.number().optional(),
  pattern_day_trader: Z.boolean().optional(),
  trade_suspended_by_user: Z.boolean().optional(),
  trading_blocked: Z.boolean().optional(),
  transfers_blocked: Z.boolean().optional(),
  account_blocked: Z.boolean().optional(),
  created_at: AlpacaDateTimeSchema.optional(),
  shorting_enabled: Z.boolean().optional(),
  long_market_value: Z.coerce.number().optional(),
  short_market_value: Z.coerce.number().optional(),
  equity: Z.coerce.number().optional(),
  last_equity: Z.coerce.number().optional(),
  multiplier: Z.coerce.number().int().optional(),
  buying_power: Z.coerce.number().optional(),
  maintenance_margin: Z.coerce.number().optional(),
  initial_margin: Z.coerce.number().optional(),
  sma: Z.coerce.number().optional(),
  daytrade_count: Z.int().optional(),
  balance_asof: AlpacaDateSchema.optional(),
  last_maintenance_margin: Z.coerce.number().optional(),
  daytrading_buying_power: Z.coerce.number().optional(),
  regt_buying_power: Z.coerce.number().optional(),
  options_buying_power: Z.coerce.number().optional(),
  options_approved_level: OptionsTradingLevelSchema.optional(),
  options_trading_level: OptionsTradingLevelSchema.optional(),
  intraday_adjustments: Z.coerce.number().optional(),
  pending_reg_taf_fees: Z.coerce.number().optional(),

  // Undocumented fields, see https://docs.alpaca.markets/reference/getaccount-1 200 example
  effective_buying_power: Z.unknown().optional(),
  position_market_value: Z.unknown().optional(),
  bod_dtbp: Z.unknown().optional(),
  crypto_tier: Z.unknown().optional(),
  admin_configurations: Z.unknown().optional(),
  user_configurations: Z.unknown().optional(),
  crypto_status: Z.unknown().optional(),
}).strict();

export type Account = Z.infer<typeof AccountSchema>;

export const HistoryQuerySchema = Z.object({
  period: HistoryPeriodSchema.optional(),
  timeframe: HistoryTimeframeSchema.optional(),
  intraday_reporting: HistoryIntradayReportingSchema.optional(),
  start: AlpacaDateTimeSchema.optional(),
  pnl_reset: HistoryPNLResetSchema.optional(),
  end: AlpacaDateTimeSchema.optional(),
  extended_hours: Z.boolean().transform(String).optional(), // deprecated, use `intraday_reporting`
  cashflow_types: HistoryIntradayReportingSchema.optional(),
}).strict();

export type HistoryQuery = Z.input<typeof HistoryQuerySchema>;

export const HistoryElementSchema = Z.object({
  timestamp: Z.int(),
  equity: Z.number(),
  profit_loss: Z.number(),
  profit_loss_pct: Z.number(),
}).strict();

export type HistoryElement = Z.infer<typeof HistoryElementSchema>;

export const HistorySchema = Z.object({
  timestamp: Z.int().array(),
  equity: Z.number().array(),
  profit_loss: Z.number().array(),
  profit_loss_pct: Z.number().array(),
  base_value: Z.number(),
  base_value_asof: AlpacaDateSchema.optional(),
  timeframe: HistoryTimeframeSchema,
  cashflow: Z.object().optional(), // ???
  // "HAS ADDITIONAL FIELDS" ?!?!
})
  // pointedly not strict
  .transform(h => ({
    frames: h.timestamp.map(
      (timestamp, i) =>
        ({
          timestamp,
          equity: h.equity[i],
          profit_loss: h.profit_loss[i],
          profit_loss_pct: h.profit_loss_pct[i],
        } satisfies HistoryElement)
    ), // I'm opinionated here
    base_value: h.base_value,
    base_value_asof: h.base_value_asof,
    timeframe: h.timeframe,
    cashflow: h.cashflow,
  }));

export type History = Z.infer<typeof HistorySchema>;
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

export type AssetsQuery = Z.input<typeof AssetsQuerySchema>;
export const AssetsQuerySchema = Z.object({
  status: ActiveStatusSchema.optional(),
  asset_class: AssetClassSchema.optional(),
  exchange: ExchangeSchema.optional(),
  attributes: AssetAttributeSchema.array()
    .transform(arr => arr.join(","))
    .optional(),
}).strict();

export const AssetsQueryResponseSchema = AssetSchema.array();

export type Deliverable = Z.infer<typeof DeliverableSchema>;
export const DeliverableSchema = Z.object({
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
export const OptionContractSchema = Z.object({
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

export type OptionContractsQuery = Z.input<typeof OptionContractsQuerySchema>;
export const OptionContractsQuerySchema = Z.object({
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

export const OptionContractsQueryResponseSchema = Z.object({
  option_contracts: OptionContractSchema.array(),
})
  .strict()
  .transform(r => r.option_contracts); // opinionated

export type Treasury = Z.infer<typeof TreasurySchema>;
export const TreasurySchema = Z.object({
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

export type TreasuriesQuery = Z.input<typeof TreasuriesQuerySchema>;
export const TreasuriesQuerySchema = Z.object({
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

export const TreasuriesQueryResponseSchema = Z.object({
  us_treasuries: TreasurySchema.array(),
})
  .strict()
  .transform(r => r.us_treasuries);

export type Position = Z.infer<typeof PositionSchema>;
export const PositionSchema = Z.object({
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

export const AllPositionsResponseSchema = PositionSchema.array();

export type ClosePositionQuery = Z.input<typeof ClosePositionQuerySchema>;
export const ClosePositionQuerySchema = Z.union([
  Z.object({ qty: Z.number().transform(String) }),
  Z.object({ percentage: Z.number().transform(String) }),
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

export type ClosePositionResponse = Z.infer<typeof ClosePositionResponseSchema>;
export const ClosePositionResponseSchema = Z.object({
  symbol: Z.string(),
  status: Z.number(),
  body: OrderSchema,
});

export const CloseAllPositionsResponseSchema = ClosePositionResponseSchema.array();

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

export type CalendarDateType = Z.infer<typeof CalendarDateTypeSchema>;

export const CalendarDaySchema = Z.object({
  date: Z.string(),
  open: Z.string(),
  close: Z.string(),
  settlement_date: Z.string(),
});
export type CalendarDay = Z.infer<typeof CalendarDaySchema>;

export const CalendarSchema = Z.array(CalendarDaySchema);
export type Calendar = Z.infer<typeof CalendarSchema>;

export const ClockSchema = Z.object({
  timestamp: AlpacaDateTimeSchema,
  is_open: Z.boolean(),
  next_open: AlpacaDateTimeSchema,
  next_close: AlpacaDateTimeSchema,
});
export type Clock = Z.infer<typeof ClockSchema>;

export const CalendarQuerySchema = Z.object({
  start: AlpacaDateSchema.optional(),
  end: AlpacaDateSchema.optional(),
  date_type: CalendarDateTypeSchema.optional(),
});
export type CalendarQuery = Z.input<typeof CalendarQuerySchema>;

export const WatchlistSchema = Z.object({
  id: Z.uuid(),
  account_id: Z.uuid(),
  created_at: AlpacaDateSchema,
  updated_at: AlpacaDateSchema,
  name: Z.string().min(1),
  assets: AssetSchema.array().optional(),
}).strict();

export type Watchlist = Z.infer<typeof WatchlistSchema>;

export const CreateWatchlistBodySchema = Z.object({
  name: Z.string().min(1),
  symbols: Z.string().nullable().array(),
}).strict();

export type CreateWatchlistBody = Z.input<typeof CreateWatchlistBodySchema>;

export const UpdateWatchlistQuerySchema = Z.object({
  name: Z.string().min(1).optional(),
}).strict();

export type UpdateWatchlistQuery = Z.input<typeof UpdateWatchlistQuerySchema>;

export const UpdateWatchlistBodySchema = Z.object({
  name: Z.string().min(1).optional(),
  symbols: Z.string().nullable().array().optional(),
}).strict();

export type UpdateWatchlistBody = Z.input<typeof UpdateWatchlistBodySchema>;

export const AccountConfigsSchema = Z.object({
  dtbp_check: DTBPCheckSchema.optional(),
  trade_confirm_email: TradeConfirmEmailSchema.optional(),
  suspend_trade: Z.boolean().optional(),
  no_shorting: Z.boolean().optional(),
  fractional_trading: Z.boolean().optional(),
  max_margin_multiplier: MaxMarginMultiplierSchema.optional(),
  max_options_trading_level: MaxOptionsTradingLevelSchema.optional(),
  pdt_check: PDTCheckSchema.optional(),
  ptp_no_exception_entry: Z.boolean().optional(),
}).strict();
export type AccountConfigs = Z.infer<typeof AccountConfigBodySchema>;

export const AccountConfigBodySchema = Z.object({
  dtbp_check: DTBPCheckSchema.optional(),
  trade_confirm_email: TradeConfirmEmailSchema.optional(),
  suspend_trade: Z.boolean().optional(),
  no_shorting: Z.boolean().optional(),
  fractional_trading: Z.boolean().optional(),
  max_margin_multiplier: MaxMarginMultiplierSchema.transform(String).optional(),
  max_options_trading_level: MaxOptionsTradingLevelSchema.optional(),
  pdt_check: PDTCheckSchema.optional(),
  ptp_no_exception_entry: Z.boolean().optional(),
});
export type AccountConfigBody = Z.input<typeof AccountConfigBodySchema>;
