import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const processPaymentProcedure = protectedProcedure
  .input(
    z.object({
      missionId: z.string(),
      paymentIntentId: z.string(),
      paymentMethodId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Processing payment for mission:', input.missionId);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = Math.random() > 0.1;

    if (!success) {
      return {
        success: false,
        error: 'Payment declined. Please try another payment method.',
      };
    }

    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
    };
  });
