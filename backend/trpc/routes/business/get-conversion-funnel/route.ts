import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const getConversionFunnelProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']),
    })
  )
  .query(async ({ input }) => {
    console.log('[Business Analytics] Getting conversion funnel:', input);

    const totalVisitors = 10000 + Math.floor(Math.random() * 5000);
    const signups = Math.floor(totalVisitors * (0.15 + Math.random() * 0.1));
    const profileCompleted = Math.floor(signups * (0.7 + Math.random() * 0.15));
    const firstRequest = Math.floor(profileCompleted * (0.5 + Math.random() * 0.2));
    const matchedMission = Math.floor(firstRequest * (0.8 + Math.random() * 0.15));
    const completedMission = Math.floor(matchedMission * (0.85 + Math.random() * 0.1));
    const repeatCustomer = Math.floor(completedMission * (0.4 + Math.random() * 0.2));

    const funnel = [
      { stage: 'Visitors', count: totalVisitors, percentage: 100 },
      { stage: 'Sign Ups', count: signups, percentage: Math.round((signups / totalVisitors) * 100) },
      { stage: 'Profile Completed', count: profileCompleted, percentage: Math.round((profileCompleted / totalVisitors) * 100) },
      { stage: 'First Request', count: firstRequest, percentage: Math.round((firstRequest / totalVisitors) * 100) },
      { stage: 'Matched Mission', count: matchedMission, percentage: Math.round((matchedMission / totalVisitors) * 100) },
      { stage: 'Completed Mission', count: completedMission, percentage: Math.round((completedMission / totalVisitors) * 100) },
      { stage: 'Repeat Customer', count: repeatCustomer, percentage: Math.round((repeatCustomer / totalVisitors) * 100) },
    ];

    const dropoffAnalysis = funnel.slice(1).map((stage, index) => {
      const previousStage = funnel[index];
      const dropoff = previousStage.count - stage.count;
      const dropoffRate = Math.round((dropoff / previousStage.count) * 100);

      return {
        from: previousStage.stage,
        to: stage.stage,
        dropoff,
        dropoffRate,
      };
    });

    return {
      period: input.period,
      funnel,
      dropoffAnalysis,
      overallConversionRate: Math.round((completedMission / totalVisitors) * 10000) / 100,
    };
  });
