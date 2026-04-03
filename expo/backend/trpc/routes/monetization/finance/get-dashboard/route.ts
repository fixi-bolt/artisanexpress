import { protectedProcedure } from '../../../../create-context';

export const getFinanceDashboardProcedure = protectedProcedure
  .query(async () => {
    console.log('Monetization.getFinanceDashboard');

    return {
      mrr: 1820,
      arr: 21840,
      arpu: 6.4,
      premiumClients: 285,
      adRevenue: 420,
      marketplaceRevenue: 960,
      refundsRate: 0.8,
      grossRevenue: 3400,
      netMargin: 0.62,
      last30Days: Array.from({ length: 30 }).map((_, i) => ({
        day: i - 29,
        revenue: Math.round(80 + Math.random() * 60),
      })),
    } as const;
  });
