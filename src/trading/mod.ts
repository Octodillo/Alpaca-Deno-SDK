import type { Endpoint } from "../client.ts";
import { failOnPartial } from "../errors.ts";
import * as T from "../generated/trading/endpoints.ts";
import type { ActivityType, Market } from "../generated/trading/schemas.ts";

export const cancelAllOrders = {
  ...T.deleteAllOrders,
  response: T.deleteAllOrders.response.transform(failOnPartial(T.deleteAllOrders.name, (item) => `order ${item.id}`)),
} satisfies Endpoint;

export const closeAllPositions = {
  ...T.deleteAllOpenPositions,
  response: T.deleteAllOpenPositions.response.transform(
    failOnPartial(T.deleteAllOpenPositions.name, (item) => `position ${item.symbol}`),
  ),
} satisfies Endpoint;

export const tradingEndpoints = {
  account: {
    get: T.getAccount,
    history: T.getAccountPortfolioHistory,
    configs: T.getAccountConfig,
    config: T.patchAccountConfig,
    activities: T.getAccountActivities,
    activitiesByType: {
      ...T.getAccountActivitiesByActivityType,
      args: (activity_type: ActivityType) => ({ params: { activity_type } }),
    } satisfies Endpoint,
  },

  orders: {
    create: T.postOrder,
    search: T.getAllOrders,
    get: {
      ...T.getOrderByOrderID,
      args: (order_id: string, nested?: boolean) => ({ params: { order_id }, query: { nested } }),
    } satisfies Endpoint,
    getByClientID: {
      ...T.getOrderByClientOrderId,
      args: (client_order_id: string) => ({ query: { client_order_id } }),
    } satisfies Endpoint,
    replace: T.patchOrderByOrderId,
    delete: {
      ...T.deleteOrderByOrderID,
      args: (order_id: string) => ({ params: { order_id } }),
    } satisfies Endpoint,
    deleteAll: cancelAllOrders,
  },

  positions: {
    all: T.getAllOpenPositions,
    get: {
      ...T.getOpenPosition,
      args: (symbol_or_asset_id: string) => ({ params: { symbol_or_asset_id } }),
    } satisfies Endpoint,
    close: T.deleteOpenPosition,
    closeAll: closeAllPositions,
    exercise: {
      ...T.optionExercise,
      args: (symbol_or_contract_id: string) => ({ params: { symbol_or_contract_id } }),
    } satisfies Endpoint,
    doNotExercise: {
      ...T.optionDoNotExercise,
      args: (symbol_or_contract_id: string) => ({ params: { symbol_or_contract_id } }),
    } satisfies Endpoint,
  },

  watchlists: {
    all: T.getWatchlists,
    create: T.postWatchlist,
    getByID: {
      ...T.getWatchlistById,
      args: (watchlist_id: string) => ({ params: { watchlist_id } }),
    } satisfies Endpoint,
    getByName: {
      ...T.getWatchlistByName,
      args: (name: string) => ({ query: { name } }),
    } satisfies Endpoint,
    updateByID: T.updateWatchlistById,
    updateByName: T.updateWatchlistByName,
    addByID: T.addAssetToWatchlist,
    addByName: T.addAssetToWatchlistByName,
    remove: {
      ...T.removeAssetFromWatchlist,
      args: (watchlist_id: string, symbol: string) => ({ params: { watchlist_id, symbol } }),
    } satisfies Endpoint,
    deleteByID: {
      ...T.deleteWatchlistById,
      args: (watchlist_id: string) => ({ params: { watchlist_id } }),
    } satisfies Endpoint,
    deleteByName: {
      ...T.deleteWatchlistByName,
      args: (name: string) => ({ query: { name } }),
    } satisfies Endpoint,
  },

  assets: {
    all: T.getV2Assets,
    get: {
      ...T.getV2AssetsSymbolOrAssetId,
      args: (symbol_or_asset_id: string) => ({ params: { symbol_or_asset_id } }),
    } satisfies Endpoint,
  },

  options: {
    all: T.getOptionsContracts,
    get: {
      ...T.getOptionContractSymbolOrId,
      args: (symbol_or_id: string) => ({ params: { symbol_or_id } }),
    } satisfies Endpoint,
  },

  corporateActions: {
    announcements: T.getV2CorporateActionsAnnouncements,
    announcement: {
      ...T.getV2CorporateActionsAnnouncementsId,
      args: (id: string) => ({ params: { id } }),
    } satisfies Endpoint,
  },

  calendar: {
    ...T.legacyCalendar,
    args: (start?: string, end?: string, date_type?: "TRADING" | "SETTLEMENT") => ({
      query: { start, end, date_type },
    }),
  } satisfies Endpoint,
  clock: T.legacyClock,

  /** v3: calendars and clocks for markets beyond US equities. */
  markets: {
    calendar: {
      ...T.calendar,
      args: (market: Market, start?: string, end?: string) => ({ params: { market }, query: { start, end } }),
    } satisfies Endpoint,
    clock: T.clock,
  },

  locates: {
    list: T.listLocates,
    create: T.createLocates,
    get: {
      ...T.getLocate,
      args: (locate_id: string) => ({ params: { locate_id } }),
    } satisfies Endpoint,
    quotes: T.listLocateQuotes,
  },

  tokenization: {
    mint: T.postTokenizationMint,
    requests: T.getTokenizationRequests,
    request: {
      ...T.getTokenizationRequest,
      args: (tokenization_request_id: string) => ({ params: { tokenization_request_id } }),
    } satisfies Endpoint,
    requestByClientID: T.getTokenizationRequestByClientRequestID,
  },

  cryptoFunding: {
    wallets: T.listCryptoFundingWallets,
    estimate: T.getCryptoTransferEstimate,
    transfers: T.listCryptoFundingTransfers,
    transfer: {
      ...T.getCryptoFundingTransfer,
      args: (transfer_id: string) => ({ params: { transfer_id } }),
    } satisfies Endpoint,
    vasps: T.searchVASPs,
    whitelist: {
      list: T.listWhitelistedAddress,
      create: T.createWhitelistedAddress,
      delete: T.deleteWhitelistedAddress,
      updateTravelRule: T.updateWhitelistedAddressTravelRuleInfo,
    },
  },
};
