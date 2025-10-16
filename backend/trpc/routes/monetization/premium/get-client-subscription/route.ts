import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const getClientSubscriptionProcedure = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    console.log('Monetization.getClientSubscription', input);

    return {
      status: 'inactive' as const,
      plan: null as null | 'premium_monthly' | 'premium_annual',
      renewsAt: null as null | Date,
    };
  });
