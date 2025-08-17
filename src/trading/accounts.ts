import { Z } from "../external.ts";
import TradingClient from "./mod.ts";
import {
  Account,
  HistoryQuery,
  History,
  HistoryQuerySchema,
  HistorySchema,
  AccountSchema,
  AccountConfigBodySchema,
  AccountConfigs,
  AccountConfigBody,
} from "./schemas.ts";

export default (client: TradingClient) => ({
  get: (): Promise<Account> =>
    client.fetch({
      name: "Get Account",
      endpoint: "v2/account",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: AccountSchema,

      okStatus: 200,
    }),

  history: (query: HistoryQuery): Promise<History> =>
    client.fetch({
      name: "Get Account Portfolio History",
      endpoint: "v2/account/portfolio/history",
      method: "GET",

      querySchema: HistoryQuerySchema,
      bodySchema: Z.never(),
      responseSchema: HistorySchema,

      okStatus: 200,

      payload: { query },
    }),

  configs: (): Promise<AccountConfigs> =>
    client.fetch({
      name: "Get Account Configurations",
      endpoint: "v2/account/configurations",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: AccountConfigBodySchema,

      okStatus: 200,
    }),

  config: (body: AccountConfigBody): Promise<AccountConfigs> =>
    client.fetch({
      name: "Account Configurations",
      endpoint: "v2/account/configurations",
      method: "PATCH",

      querySchema: Z.never(),
      bodySchema: AccountConfigBodySchema,
      responseSchema: AccountConfigBodySchema,

      okStatus: 200,

      payload: { body },
    }),

  _activities() {},
});
