import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const subscribeClientProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      plan: z.enum(['premium_monthly', 'premium_annual']),
      paymentMethodId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Monetization.subscribeClient', input);

    return {
      success: true,
      subscriptionId: `sub_${Date.now()}`,
      status: 'active' as const,
      plan: input.plan,
      renewsAt: new Date(Date.now() + (input.plan === 'premium_monthly' ? 30 : 365) * 24 * 3600 * 1000),
    };
  });
