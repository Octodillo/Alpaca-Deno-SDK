import { ClientModule } from "../client.ts";
import { Z } from "../external.ts";
import {
  Asset,
  AssetSchema,
  AssetsQuerySchema,
  AssetsQueryResponseSchema,
  OptionContract,
  OptionContractSchema,
  OptionContractsQuerySchema,
  OptionContractsQueryResponseSchema,
  Treasury,
  TreasuriesQuerySchema,
  TreasuriesQueryResponseSchema,
  AssetsQuery,
  OptionContractsQuery,
  TreasuriesQuery,
} from "./schemas.ts";

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

export default class TradingInstrumentsModule extends ClientModule {
  public assets = new AssetsModule(this.client);
  public crypto = new CryptoModule(this.client);
  public options = new OptionContractsModule(this.client);

  public treasuries(query: TreasuriesQuery): Promise<Treasury[]> {
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
