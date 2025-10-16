import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const createPaymentIntentProcedure = protectedProcedure
  .input(
    z.object({
      missionId: z.string(),
      amount: z.number().positive(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Creating payment intent for mission:', input.missionId);

    const paymentIntent = {
      id: `pi_${Date.now()}`,
      missionId: input.missionId,
      amount: input.amount,
      currency: 'EUR',
      status: 'pending' as const,
      clientSecret: `secret_${Date.now()}`,
    };

    return paymentIntent;
  });
