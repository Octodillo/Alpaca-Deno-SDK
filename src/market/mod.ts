import { AlpacaClient } from "../client.ts";
import StockModule from "./stock.ts";

export class MarketClient extends AlpacaClient {
  protected override baseAPI = "data";

  stock = StockModule(this);
  // Option
  // Crypto
  // Fixed Income
  // Forex
  // Logos
  // Screener
  // News
  // Corporate Actions
}
