import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { createPaymentIntentProcedure } from "./routes/payments/create-payment-intent/route";
import { processPaymentProcedure } from "./routes/payments/process-payment/route";
import { getTransactionsProcedure } from "./routes/payments/get-transactions/route";
import { getEarningsProcedure } from "./routes/payments/get-earnings/route";
import { sendMessageProcedure } from "./routes/chat/send-message/route";
import { getMessagesProcedure } from "./routes/chat/get-messages/route";
import { markReadProcedure } from "./routes/chat/mark-read/route";
import { sendNotificationProcedure } from "./routes/notifications/send-notification/route";
import { registerTokenProcedure } from "./routes/notifications/register-token/route";
import { getStatsAdminProcedure } from "./routes/admin/get-stats/route";
import { getUsersAdminProcedure } from "./routes/admin/get-users/route";
import { getMissionsAdminProcedure } from "./routes/admin/get-missions/route";
import { suspendUserAdminProcedure } from "./routes/admin/suspend-user/route";
import { deleteMissionAdminProcedure } from "./routes/admin/delete-mission/route";
import { findBestArtisansProcedure } from "./routes/matching/find-best-artisans/route";
import { getArtisanRecommendationsProcedure } from "./routes/matching/get-artisan-recommendations/route";
import { getDemandHeatmapProcedure } from "./routes/heatmap/get-demand-heatmap/route";
import { getArtisanDensityProcedure } from "./routes/heatmap/get-artisan-density/route";
import { createSubscriptionProcedure } from "./routes/subscription/create-subscription/route";
import { getSubscriptionProcedure } from "./routes/subscription/get-subscription/route";
import { cancelSubscriptionProcedure } from "./routes/subscription/cancel-subscription/route";
import { upgradeSubscriptionProcedure } from "./routes/subscription/upgrade-subscription/route";
import { getWalletProcedure } from "./routes/wallet/get-wallet/route";
import { createWithdrawalProcedure } from "./routes/wallet/create-withdrawal/route";
import { getWithdrawalsProcedure } from "./routes/wallet/get-withdrawals/route";
import { getBalanceHistoryProcedure } from "./routes/wallet/get-balance-history/route";
import { generateInvoiceProcedure } from "./routes/invoice/generate-invoice/route";
import { getInvoicesProcedure } from "./routes/invoice/get-invoices/route";
import { sendInvoiceProcedure } from "./routes/invoice/send-invoice/route";
import { estimateCostProcedure } from "./routes/ai/estimate-cost/route";
import { enhanceDescriptionProcedure } from "./routes/ai/enhance-description/route";
import { suggestCategoryProcedure } from "./routes/ai/suggest-category/route";
import { chatAssistantProcedure } from "./routes/ai/chat-assistant/route";
import { visionAnalyzeProcedure } from "./routes/ai/vision-analyze/route";
import { dynamicPricingProcedure } from "./routes/ai/dynamic-pricing/route";
import { predictEtaProcedure } from "./routes/ml/predict-eta/route";
import { dynamicPriceProcedure } from "./routes/ml/dynamic-price/route";
import { getSmartRecommendationsProcedure } from "./routes/recommendations/get-smart-recommendations/route";
import { getRevenueAnalyticsProcedure } from "./routes/business/get-revenue-analytics/route";
import { getUserMetricsProcedure } from "./routes/business/get-user-metrics/route";
import { getConversionFunnelProcedure } from "./routes/business/get-conversion-funnel/route";
import { getCampaignsProcedure } from "./routes/marketing/get-campaigns/route";
import { createCampaignProcedure } from "./routes/marketing/create-campaign/route";
import { sendPromotionalNotificationProcedure } from "./routes/marketing/send-promotional-notification/route";
import { getCustomerProfilesProcedure } from "./routes/crm/get-customer-profiles/route";
import { addCustomerNoteProcedure } from "./routes/crm/add-customer-note/route";
import { getCustomerHistoryProcedure } from "./routes/crm/get-customer-history/route";
import { getProductsProcedure } from "./routes/monetization/marketplace/get-products/route";
import { purchaseProductProcedure } from "./routes/monetization/marketplace/purchase-product/route";
import { subscribeClientProcedure } from "./routes/monetization/premium/subscribe-client/route";
import { getClientSubscriptionProcedure } from "./routes/monetization/premium/get-client-subscription/route";
import { getAdPreferencesProcedure } from "./routes/monetization/ads/get-preferences/route";
import { updateAdPreferencesProcedure } from "./routes/monetization/ads/update-preferences/route";
import { requestPartnershipProcedure } from "./routes/monetization/b2b/request-partnership/route";
import { getFinanceDashboardProcedure } from "./routes/monetization/finance/get-dashboard/route";
import { createApiKeyProcedure } from "./routes/public-api/create-api-key/route";
import { listEndpointsProcedure } from "./routes/public-api/list-endpoints/route";
import { verifySiretProcedure } from "./routes/compliance/verify-siret/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  payments: createTRPCRouter({
    createPaymentIntent: createPaymentIntentProcedure,
    processPayment: processPaymentProcedure,
    getTransactions: getTransactionsProcedure,
    getEarnings: getEarningsProcedure,
  }),
  chat: createTRPCRouter({
    sendMessage: sendMessageProcedure,
    getMessages: getMessagesProcedure,
    markRead: markReadProcedure,
  }),
  notifications: createTRPCRouter({
    sendNotification: sendNotificationProcedure,
    registerToken: registerTokenProcedure,
  }),
  admin: createTRPCRouter({
    getStats: getStatsAdminProcedure,
    getUsers: getUsersAdminProcedure,
    getMissions: getMissionsAdminProcedure,
    suspendUser: suspendUserAdminProcedure,
    deleteMission: deleteMissionAdminProcedure,
  }),
  matching: createTRPCRouter({
    findBestArtisans: findBestArtisansProcedure,
    getRecommendations: getArtisanRecommendationsProcedure,
  }),
  heatmap: createTRPCRouter({
    getDemandHeatmap: getDemandHeatmapProcedure,
    getArtisanDensity: getArtisanDensityProcedure,
  }),
  subscription: createTRPCRouter({
    create: createSubscriptionProcedure,
    get: getSubscriptionProcedure,
    cancel: cancelSubscriptionProcedure,
    upgrade: upgradeSubscriptionProcedure,
  }),
  wallet: createTRPCRouter({
    getWallet: getWalletProcedure,
    createWithdrawal: createWithdrawalProcedure,
    getWithdrawals: getWithdrawalsProcedure,
    getBalanceHistory: getBalanceHistoryProcedure,
  }),
  invoice: createTRPCRouter({
    generate: generateInvoiceProcedure,
    getInvoices: getInvoicesProcedure,
    send: sendInvoiceProcedure,
  }),
  ai: createTRPCRouter({
    estimateCost: estimateCostProcedure,
    enhanceDescription: enhanceDescriptionProcedure,
    suggestCategory: suggestCategoryProcedure,
    chatAssistant: chatAssistantProcedure,
    visionAnalyze: visionAnalyzeProcedure,
    dynamicPricing: dynamicPricingProcedure,
  }),
  ml: createTRPCRouter({
    predictEta: predictEtaProcedure,
    dynamicPrice: dynamicPriceProcedure,
  }),
  recommendations: createTRPCRouter({
    getSmartRecommendations: getSmartRecommendationsProcedure,
  }),
  business: createTRPCRouter({
    getRevenueAnalytics: getRevenueAnalyticsProcedure,
    getUserMetrics: getUserMetricsProcedure,
    getConversionFunnel: getConversionFunnelProcedure,
  }),
  marketing: createTRPCRouter({
    getCampaigns: getCampaignsProcedure,
    createCampaign: createCampaignProcedure,
    sendPromotionalNotification: sendPromotionalNotificationProcedure,
  }),
  crm: createTRPCRouter({
    getCustomerProfiles: getCustomerProfilesProcedure,
    addCustomerNote: addCustomerNoteProcedure,
    getCustomerHistory: getCustomerHistoryProcedure,
  }),
  monetization: createTRPCRouter({
    marketplace: createTRPCRouter({
      getProducts: getProductsProcedure,
      purchase: purchaseProductProcedure,
    }),
    premium: createTRPCRouter({
      subscribeClient: subscribeClientProcedure,
      getClientSubscription: getClientSubscriptionProcedure,
    }),
    ads: createTRPCRouter({
      getPreferences: getAdPreferencesProcedure,
      updatePreferences: updateAdPreferencesProcedure,
    }),
    b2b: createTRPCRouter({
      requestPartnership: requestPartnershipProcedure,
    }),
    finance: createTRPCRouter({
      getDashboard: getFinanceDashboardProcedure,
    }),
  }),
  publicApi: createTRPCRouter({
    createApiKey: createApiKeyProcedure,
    listEndpoints: listEndpointsProcedure,
  }),
  compliance: createTRPCRouter({
    verifySiret: verifySiretProcedure,
  }),
});

export type AppRouter = typeof appRouter;
