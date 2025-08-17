import { Z } from "../external.ts";
import TradingClient from "./mod.ts";
import {
  WatchlistSchema,
  CreateWatchlistBody,
  CreateWatchlistBodySchema,
  UpdateWatchlistBody,
  UpdateWatchlistQuerySchema,
  UpdateWatchlistBodySchema,
} from "./schemas.ts";

export default (client: TradingClient) => ({
  all: () =>
    client.fetch({
      name: "Get All Watchlists",
      endpoint: "v2/watchlists",
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: WatchlistSchema.array(),

      okStatus: 200,
    }),

  create: (body: CreateWatchlistBody) =>
    client.fetch({
      name: "Create Watchlist",
      endpoint: "v2/watchlists",
      method: "POST",

      querySchema: Z.never(),
      bodySchema: CreateWatchlistBodySchema,
      responseSchema: WatchlistSchema,

      okStatus: 200,

      payload: { body },
    }),

  getByName: (name: string) =>
    client.fetch({
      name: "Get Watchlist by Name",
      endpoint: "v2/watchlists:by_name",
      method: "GET",

      querySchema: Z.object({ name: Z.string() }),
      bodySchema: Z.never(),
      responseSchema: WatchlistSchema,

      okStatus: 200,

      payload: { query: { name } },
    }),

  getByID: (watchlist_id: Z.ZodUUID) =>
    client.fetch({
      name: "Get Watchlist by ID",
      endpoint: `v2/watchlists/${watchlist_id}`,
      method: "GET",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: WatchlistSchema,

      okStatus: 200,
    }),

  updateByName: (name: string, body: UpdateWatchlistBody) =>
    client.fetch({
      name: "Update Watchlist by Name",
      endpoint: "v2/watchlists:by_name",
      method: "PUT",

      querySchema: UpdateWatchlistQuerySchema,
      bodySchema: UpdateWatchlistBodySchema,
      responseSchema: WatchlistSchema,

      okStatus: 200,

      payload: { query: { name }, body },
    }),

  updateByID: (watchlist_id: Z.ZodUUID, body: UpdateWatchlistBody) =>
    client.fetch({
      name: "Update Watchlist by ID",
      endpoint: `v2/watchlists/${watchlist_id}`,
      method: "PUT",

      querySchema: Z.never(),
      bodySchema: UpdateWatchlistBodySchema,
      responseSchema: WatchlistSchema,

      okStatus: 200,

      payload: { body },
    }),

  addByName: (name: string, symbols: string[]) =>
    client.fetch({
      name: "Add Symbols to Watchlist by Name",
      endpoint: "v2/watchlists:by_name",
      method: "POST",

      querySchema: Z.object({ name: Z.string() }),
      bodySchema: Z.object({ symbols: Z.string().array().optional() }).strict(),
      responseSchema: WatchlistSchema,

      okStatus: 200,

      payload: { query: { name }, body: { symbols } },
    }),

  addByID: (watchlist_id: Z.ZodUUID, symbols: string[]) =>
    client.fetch({
      name: "Add Symbols to Watchlist by ID",
      endpoint: `v2/watchlists/${watchlist_id}`,
      method: "POST",

      querySchema: Z.never(),
      bodySchema: Z.object({ symbols: Z.string().array().optional() }).strict(),
      responseSchema: WatchlistSchema,

      okStatus: 200,

      payload: { body: { symbols } },
    }),

  deleteByName: (name: string) =>
    client.fetch({
      name: "Delete Watchlist by Name",
      endpoint: "v2/watchlists:by_name",
      method: "DELETE",

      querySchema: Z.object({ name: Z.string() }),
      bodySchema: Z.never(),
      responseSchema: Z.never(),

      okStatus: 204,

      payload: { query: { name } },
    }),

  deleteByID: (watchlist_id: Z.ZodUUID) =>
    client.fetch({
      name: "Delete Watchlist by ID",
      endpoint: `v2/watchlists/${watchlist_id}`,
      method: "DELETE",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.never(),

      okStatus: 204,
      statusMessages: {
        404: `Watchlist Not Found: ${watchlist_id}`,
      },
    }),

  remove: (watchlist_id: Z.ZodUUID, symbol: string) =>
    client.fetch({
      name: "Remove Symbol from Watchlist by ID",
      endpoint: `v2/watchlists/${watchlist_id}/${symbol}`,
      method: "DELETE",

      querySchema: Z.never(),
      bodySchema: Z.never(),
      responseSchema: Z.never(),

      okStatus: 200,
    }),
});
