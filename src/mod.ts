import { BrokerClient } from "./broker/mod.ts";
import { APIMethod, BodyParams, QueryParams } from "./client.ts";
import { loadSync } from "./external.ts";
import { MarketClient } from "./market/mod.ts";
import TradingClient from "./trading/mod.ts";

export interface AlpacaAuth {
  key: string;
  secret: string;
}

export interface AlpacaConfig {
  auth?: AlpacaAuth;
  paper: boolean;
}

export default class Alpaca {
  private auth: AlpacaAuth;
  constructor(public config: AlpacaConfig) {
    this.auth = config.auth ?? (loadSync() as unknown as AlpacaAuth);
  }

  public readonly trading = new TradingClient(this);
  public readonly market = new MarketClient(this);
  public readonly broker = new BrokerClient(this);

  public fetch(
    url: URL,
    method: APIMethod,
    data?: {
      query?: QueryParams;
      body?: BodyParams;
    }
  ) {
    const requestInit: RequestInit = {
      method,
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": this.auth.key,
        "APCA-API-SECRET-KEY": this.auth.secret,
      },
    };

    if (data?.query) {
      const queryEntries = Object.entries(data.query);
      queryEntries.forEach(([key, value]) => url.searchParams.set(key, value?.toString() ?? ""));
    }

    if (data?.body) {
      requestInit.headers = {
        ...requestInit.headers,
        "content-type": "application/json",
      };
      requestInit.body = JSON.stringify(data.body);
    }

    return fetch(url, requestInit);
  }
}
