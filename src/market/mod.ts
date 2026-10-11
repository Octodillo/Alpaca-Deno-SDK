import { AlpacaClient } from "../client.ts";
import { StockSymbol } from "./schema.ts";
import StockModule from "./stock.ts";
import OptionModule from "./option.ts";
import CryptoModule from "./crypto.ts";

export class MarketClient extends AlpacaClient {
  protected override baseAPI = "data";

  stock = StockModule(this);
  option = OptionModule(this);
  crypto = CryptoModule(this);
  // Forex
  // Screener

  logo = (symbol: StockSymbol, placeholder = true) => null;
  news = (query: {}) => null;
  corporateActions = (query: {}) => null;
  fixedIncomeLatestPrices = (isins: string) => null;
}
