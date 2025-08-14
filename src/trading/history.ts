import { ClientModule } from "../client.ts";
import { AlpacaDateSchema, AlpacaDateTimeSchema } from "./time.ts";
import { Z } from "../external.ts";

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

export const HistoryCashflowTypesSchema = Z.union([ActivityTypesSchema, Z.enum(["ALL", "NONE"])]);

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

export default class TradingHistoryModule extends ClientModule {
  get(query: HistoryQuery): Promise<History> {
    return this.client.fetch({
      name: "Get Account Portfolio History",
      endpoint: "v2/account/portfolio/history",
      method: "GET",

      querySchema: HistoryQuerySchema,
      bodySchema: Z.never(),
      responseSchema: HistorySchema,

      okStatus: 200,
      statusMessages: {},

      payload: {
        query,
      },
    });
  }
}
