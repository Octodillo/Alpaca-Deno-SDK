import { ClientModule } from "../client.ts";
import { Z } from "../external.ts";
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

  history(query: HistoryQuery): Promise<History> {
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

  configs(): Promise<AccountConfigs> {
    return this.client.fetch({
      name: "Get Account Configurations",
      endpoint: "v2/account/configurations",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: AccountConfigBodySchema,

      okStatus: 200,
      statusMessages: {},

      payload: {},
    });
  }

  config(body: AccountConfigBody) {
    return this.client.fetch({
      name: "Account Configurations",
      endpoint: "v2/account/configurations",
      method: "PATCH",

      querySchema: Z.never(),
      bodySchema: AccountConfigBodySchema,
      responseSchema: AccountConfigBodySchema,

      okStatus: 200,
      statusMessages: {},

      payload: { body },
    });
  }

  _activities() {}
}
