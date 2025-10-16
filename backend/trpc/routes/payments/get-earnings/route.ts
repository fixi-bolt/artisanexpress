import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const getEarningsProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
      period: z.enum(['week', 'month', 'year']).optional(),
    })
  )
  .query(async ({ input }) => {
    console.log('Fetching earnings for artisan:', input.artisanId);

    return {
      totalEarnings: 0,
      totalCommissions: 0,
      netEarnings: 0,
      completedMissions: 0,
      pendingPayouts: 0,
    };
  });
