import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const getUserMetricsProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']),
    })
  )
  .query(async ({ input }) => {
    console.log('[Business Analytics] Getting user metrics:', input);

    const now = new Date();
    const dataPoints = input.period === 'week' ? 7 : input.period === 'month' ? 30 : 12;

    const userData = Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date(now);
      if (input.period === 'week' || input.period === 'month') {
        date.setDate(date.getDate() - (dataPoints - i - 1));
      } else {
        date.setMonth(date.getMonth() - (dataPoints - i - 1));
      }

      return {
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50 + 10),
        activeUsers: Math.floor(Math.random() * 200 + 100),
        newClients: Math.floor(Math.random() * 30 + 5),
        newArtisans: Math.floor(Math.random() * 20 + 5),
      };
    });

    const totalNewUsers = userData.reduce((sum, d) => sum + d.newUsers, 0);
    const totalClients = 1234 + userData.reduce((sum, d) => sum + d.newClients, 0);
    const totalArtisans = 567 + userData.reduce((sum, d) => sum + d.newArtisans, 0);
    const totalUsers = totalClients + totalArtisans;

    const previousPeriodUsers = totalNewUsers * (0.8 + Math.random() * 0.4);
    const userGrowth = ((totalNewUsers - previousPeriodUsers) / previousPeriodUsers) * 100;

    const averageSessionDuration = 8.5 + Math.random() * 3;
    const retentionRate = 65 + Math.random() * 15;
    const churnRate = 100 - retentionRate;

    return {
      period: input.period,
      userData,
      summary: {
        totalUsers,
        totalClients,
        totalArtisans,
        newUsers: totalNewUsers,
        userGrowth: Math.round(userGrowth * 10) / 10,
        averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
      },
      userSegments: [
        { segment: 'Active Users', count: Math.floor(totalUsers * 0.45), percentage: 45 },
        { segment: 'Occasional Users', count: Math.floor(totalUsers * 0.35), percentage: 35 },
        { segment: 'Inactive Users', count: Math.floor(totalUsers * 0.15), percentage: 15 },
        { segment: 'At Risk', count: Math.floor(totalUsers * 0.05), percentage: 5 },
      ],
    };
  });
