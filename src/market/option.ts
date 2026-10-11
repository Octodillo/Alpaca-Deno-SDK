import { Z } from "../external.ts";
import { MarketClient } from "./mod.ts";
import { TickType } from "./schema.ts";

export default (client: MarketClient) => ({
  conditionCodes: (tickType: TickType) =>
    client.fetch({
      name: "Condition codes",
      endpoint: `v1beta1/options/meta/conditions/${tickType}`,
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.record(Z.string().length(1), Z.string()),

      okStatus: 200,
    }),

  exchangeCodes: () =>
    client.fetch({
      name: "Exchange codes",
      endpoint: "v1beta1/options/meta/exchanges",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.record(Z.string().length(1), Z.string()),

      okStatus: 200,
    }),

  optionChain: null,
  snapshots: null,

  latest: {
    quotes: null,
    trades: null,
  },

  historical: {
    quotes: null,
    trades: null,
    bars: null,
  },
});
