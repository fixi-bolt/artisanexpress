import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const getRevenueAnalyticsProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    console.log('[Business Analytics] Getting revenue analytics:', input);

    const now = new Date();
    const dataPoints = input.period === 'week' ? 7 : input.period === 'month' ? 30 : input.period === 'quarter' ? 12 : 12;

    const revenueData = Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (dataPoints - i - 1));
      
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 5000 + 2000,
        commissions: Math.random() * 500 + 200,
        transactions: Math.floor(Math.random() * 50 + 10),
      };
    });

    const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
    const totalCommissions = revenueData.reduce((sum, d) => sum + d.commissions, 0);
    const totalTransactions = revenueData.reduce((sum, d) => sum + d.transactions, 0);
    const averageTransactionValue = totalRevenue / totalTransactions;

    const previousPeriodRevenue = totalRevenue * (0.85 + Math.random() * 0.3);
    const revenueGrowth = ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;

    return {
      period: input.period,
      revenueData,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalCommissions: Math.round(totalCommissions),
        totalTransactions,
        averageTransactionValue: Math.round(averageTransactionValue),
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      },
      topCategories: [
        { category: 'plumber', revenue: totalRevenue * 0.3, count: Math.floor(totalTransactions * 0.3) },
        { category: 'electrician', revenue: totalRevenue * 0.25, count: Math.floor(totalTransactions * 0.25) },
        { category: 'carpenter', revenue: totalRevenue * 0.2, count: Math.floor(totalTransactions * 0.2) },
        { category: 'locksmith', revenue: totalRevenue * 0.15, count: Math.floor(totalTransactions * 0.15) },
        { category: 'painter', revenue: totalRevenue * 0.1, count: Math.floor(totalTransactions * 0.1) },
      ],
    };
  });
