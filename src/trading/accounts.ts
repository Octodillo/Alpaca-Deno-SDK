import { ClientModule } from "../client.ts";
import { CurrencySchema } from "../common.ts";
import { Z } from "../external.ts";
import { AlpacaDateSchema, AlpacaDateTimeSchema } from "./time.ts";

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
export enum OptionsTradingLevel {
  "disabled" = 0,
  "Covered Call/Cash-Secured Put" = 1,
  "Long Call/Put" = 2,
  "Spreads/Straddles" = 3,
}
export const OptionsTradingLevelSchema = Z.enum(OptionsTradingLevel);

const AccountSchema = Z.object({
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

export default class TradingAccountModule extends ClientModule {
  get(): Promise<Account> {
    return this.client.fetch({
      name: "Get Account",
      endpoint: "v2/account",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: AccountSchema,

      okStatus: 200,
      statusMessages: {},

      payload: {},
    });
  }

  _configs() {}
  _config() {}
  _activities() {}
}
