import { AlpacaAuth, AlpacaClient, AlpacaConfig } from "./client.ts";
import { APIMethod, BodyParams, QueryParams } from "./common.ts";
import { loadSync } from "./external.ts";
import {
  TradingAccountModule,
  TradingTimeModule,
  TradingHistoryModule,
  TradingOrdersModule,
  TradingWatchlistsModule,
  TradingInstrumentsModule,
} from "./trading/mod.ts";

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

export class TradingClient extends AlpacaClient {
  protected override getBaseAPI(): string {
    return this.alpaca.config.paper ? "paper-api" : "live";
  }

  public readonly account = new TradingAccountModule(this);
  public readonly instruments = new TradingInstrumentsModule(this);
  public readonly orders = new TradingOrdersModule(this);
  public readonly history = new TradingHistoryModule(this);
  public readonly watchlists = new TradingWatchlistsModule(this);
  public readonly time = new TradingTimeModule(this);
}

export class MarketClient extends AlpacaClient {
  protected override getBaseAPI() {
    return "data";
  }

  // Stock
  // Option
  // Crypto
  // Fixed Income
  // Forex
  // Logos
  // Screener
  // News
  // Corporate Actions
}

export class BrokerClient extends AlpacaClient {
  protected override getBaseAPI(): string {
    return "broker-api.sandbox";
  }

  // Accounts
  // Documents
  // Trading
  // Assets
  // Calendar
  // Events
  // Funding
  // Funding Wallets
  // Instant Funding
  // OAuth
  // Clock
  // Journals
  // Corporate Actions
  // Watchlist
  // KYC
  // Rebalncing
  // Logos
  // Reporting
  // Country Info
  // Crypto Funding
  // IRA
  // Cash Interest
  // FPSL Program
}
