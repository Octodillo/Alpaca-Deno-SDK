import type { Endpoint } from "../client.ts";
import { failOnPartial } from "../errors.ts";
import * as B from "../generated/broker/endpoints.ts";

// Not live-tested: there are no broker credentials. See the README.

export const cancelAllOrdersForAccount = {
  ...B.deleteAllOrdersForAccount,
  response: B.deleteAllOrdersForAccount.response.transform(
    failOnPartial(B.deleteAllOrdersForAccount.name, (item) => `order ${item.id}`),
  ),
} satisfies Endpoint;

export const closeAllPositionsForAccount = {
  ...B.closeAllPositionsForAccount,
  response: B.closeAllPositionsForAccount.response.transform(
    failOnPartial(B.closeAllPositionsForAccount.name, (item) => `position ${item.symbol}`),
  ),
} satisfies Endpoint;

/** Grouped by the spec's tags. */
export const brokerEndpoints = {
  accounts: {
    list: B.getAllAccounts,
    create: B.createAccount,
    get: { ...B.getAccount, args: (account_id: string) => ({ params: { account_id } }) } satisfies Endpoint,
    update: B.patchAccount,
    close: B.postV1AccountsAccountIdActionsClose,
    requestOptions: B.requestOptionsForAccount,
    optionsApprovals: B.requestListOptionsApprovals,
    activities: B.getAccountActivities,
    activitiesByType: B.getAccountActivitiesByType,
    tradingAccount: B.getTradingAccount,
  },

  acats: {
    list: B.listACATSTransfers,
    listForAccount: B.listACATSTransfersByAccount,
    request: B.requestACATSTransfer,
    get: B.getACATSTransfer,
    assets: B.listACATSAssets,
    contraBrokers: B.listACATSContraBrokers,
  },

  assets: {
    list: B.getAssets,
    get: B.getAssetBySymbolOrId,
    entryRequirements: B.getAssetEntryRequirements,
    corporates: B.usCorporates,
    treasuries: B.usTreasuries,
    optionContracts: B.getOptionsContracts,
    optionContract: B.getOptionContractSymbolOrId,
  },

  calendar: B.legacyCalendar,
  clock: B.legacyClock,
  /** v3: calendars and clocks for markets beyond US equities. */
  markets: {
    calendar: B.calendar,
    clock: B.clock,
  },

  cashInterest: {
    aprTiers: B.getV1ListAprTiers,
  },

  corporateActions: {
    announcements: B.getCorporateAnnouncements,
    announcement: B.getGetV1CorporateActionsAnnouncementsId,
  },

  countryInfo: B.queryCountryInfos,

  cryptoFunding: {
    wallets: B.listCryptoFundingWallets,
    transfers: B.listCryptoFundingTransfers,
    createTransfer: B.createCryptoTransferForAccount,
    transfer: B.getCryptoFundingTransfer,
    estimate: B.getCryptoTransferEstimate,
    vasps: B.searchVASPs,
    whitelist: {
      list: B.listWhitelistedAddress,
      create: B.createWhitelistedAddress,
      delete: B.deleteWhitelistedAddress,
      updateTravelRule: B.updateWhitelistedAddressTravelRuleInfo,
    },
  },

  documents: {
    list: B.getDocsForAccount,
    upload: B.uploadDocToAccount,
  },

  events: {
    nonTradeActivities: B.getV1EventsNta,
  },

  fpsl: {
    accountLoans: B.getV1FpslAnalyticsAccountLoans,
    loans: B.getV1ListFpslLoans,
    tiers: B.getV1ListFpslTiers,
  },

  funding: {
    achRelationships: {
      list: B.getAccountACHRelationships,
      create: B.createACHRelationshipForAccount,
      delete: B.deleteACHRelationshipFromAccount,
    },
    recipientBanks: {
      list: B.getRecipientBanks,
      create: B.createRecipientBank,
      delete: B.deleteRecipientBank,
    },
    transfers: {
      list: B.getTransfersForAccount,
      create: B.createTransferForAccount,
      delete: B.deleteTransfer,
    },
    jit: {
      settlements: B.getV1JitSettlements,
      createSettlement: B.postV1JitSettlements,
      settlement: B.getV1JitSettlementsSingle,
      balances: B.getV1TransfersJitLedgerIdBalances,
      ledgers: B.getV1TransfersJitLedgers,
      limits: B.getV1TransfersJitLimits,
      reports: B.getV1TransfersJitReports,
    },
  },

  fundingWallets: {
    get: B.getFundingWallet,
    create: B.createFundingWallet,
    batchCreate: B.batchCreateFundingWallets,
    details: B.listFundingDetails,
    recipientBank: {
      get: B.getFundingWalletRecipientBank,
      create: B.createFundingWalletRecipientBank,
      delete: B.deleteFundingWalletRecipientBank,
    },
    transfers: B.getFundingWalletTransfers,
    transfer: B.getFundingWalletTransferByID,
    withdraw: B.createFundingWalletWithdrawal,
    demoDeposit: B.demoDepositFunding,
  },

  instantFunding: {
    list: B.getV1InstantFundingList,
    create: B.postV1InstantFunding,
    get: B.getV1InstantFundingSingle,
    delete: B.deleteV1InstantFundingSingle,
    correspondentLimits: B.getV1InstantFundingCorrespondentLimits,
    accountLimits: B.getV1InstantFundingAccountLimits,
    reports: B.getV1InstantFundingReports,
    settlements: {
      list: B.getV1InstantFundingSettlements,
      create: B.postV1InstantFundingSettlements,
      get: B.getV1InstantFundingSettlementsSingle,
    },
  },

  ipo: {
    offerings: B.listIPOOfferings,
    offering: B.getIPOOffering,
  },

  ira: {
    excessContributions: B.listIRAExcessContributions,
  },

  journals: {
    list: B.getAllJournals,
    create: B.createJournal,
    get: B.getV1JournalsJournalId,
    delete: B.deleteJournalById,
    createBatch: B.createBatchJournal,
    reverseBatch: B.postV1JournalsReverseBatch,
  },

  kyc: {
    cip: B.getV1AccountsAccountIdCip,
    submitCip: B.postV1AccountsAccountIdCip,
    updateOnfido: B.patchV1AccountsAccountIdOnfidoSdk,
    onfidoTokens: B.getV1AccountsAccountIdOnfidoSdkTokens,
  },

  oauth: {
    authorize: B.authorizeOAuthToken,
    client: B.getOAuthClient,
    issueToken: B.issueOAuthToken,
  },

  rebalancing: {
    portfolios: {
      list: B.getV1RebalancingPortfolios,
      create: B.postV1RebalancingPortfolios,
      get: B.getV1RebalancingPortfoliosPortfolioId,
      update: B.patchV1RebalancingPortfoliosPortfolioId,
      delete: B.deleteV1RebalancingPortfoliosPortfolioId,
    },
    runs: {
      list: B.getV1RebalancingRuns,
      create: B.postV1RebalancingRuns,
      get: B.getV1RebalancingRunsRunId,
      delete: B.deleteV1RebalancingRunsRunId,
    },
    subscriptions: {
      list: B.getV1RebalancingSubscriptions,
      create: B.postV1RebalancingSubscriptions,
      get: B.getV1RebalancingSubscriptionsSubscriptionId,
      delete: B.deleteV1RebalancingSubscriptionsSubscriptionId,
    },
  },

  reporting: {
    eodAggregatePositions: B.getV1ReportingEodAggregatePositions,
    eodCashInterest: B.getV1GetEodCashInterestReport,
    eodPositions: B.getV1ReportingEodPositions,
  },

  tokenization: {
    mint: B.postTokenizationMintBroker,
    callbackMint: B.postTokenizationCallbackMint,
    redeem: B.postTokenizationRedeem,
    requests: B.getTokenizationRequestsBroker,
    request: B.getTokenizationRequestByIDBroker,
    requestByClientID: B.getTokenizationRequestByClientRequestIDBroker,
    requestByIssuerID: B.getTokenizationRequestByIssuerRequestIDBroker,
  },

  trading: {
    allPositions: B.getV1AccountsPositions,
    updateConfig: B.patchPatchV1TradingAccountsAccountIdAccountConfigurations,
    limits: B.getV1AccountTradingLimits,
    portfolioHistory: B.getV1TradingAccountsAccountIdAccountPortfolioHistory,
    orders: {
      list: B.getAllOrdersForAccount,
      create: B.createOrderForAccount,
      get: B.getOrderForAccount,
      getByClientID: B.getOrderByClientOrderIdForAccount,
      replace: B.replaceOrderForAccount,
      estimate: B.getV1TradingAccountsAccountIdOrdersEstimation,
      delete: B.deleteOrderForAccount,
      deleteAll: cancelAllOrdersForAccount,
    },
    positions: {
      list: B.getPositionsForAccount,
      get: B.getPositionsForAccountBySymbol,
      close: B.closePositionForAccountBySymbol,
      closeAll: closeAllPositionsForAccount,
      exercise: B.optionExercise,
      doNotExercise: B.optionDoNotExercise,
    },
  },

  watchlists: {
    list: B.getAllWatchlistsForAccount,
    create: B.createWatchlistForAccount,
    get: B.getWatchlistForAccountById,
    update: B.replaceWatchlistForAccountById,
    add: B.postV1TradingAccountsAccountIdWatchlistsWatchlistId,
    remove: B.deleteDeleteV1TradingAccountsAccountIdWatchlistsWatchlistIdSymbol,
    delete: B.deleteWatchlistFromAccountById,
  },
};
