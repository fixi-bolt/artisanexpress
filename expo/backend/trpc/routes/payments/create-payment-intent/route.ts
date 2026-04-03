import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

export const createPaymentIntentProcedure = protectedProcedure
  .input(
    z.object({
      missionId: z.string(),
      amount: z.number().positive(),
      clientId: z.string(),
      artisanId: z.string(),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[STRIPE] Creating payment intent for mission:', input.missionId);

    try {
      const amountInCents = Math.round(input.amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        description: input.description || `Mission ${input.missionId}`,
        metadata: {
          mission_id: input.missionId,
          client_id: input.clientId,
          artisan_id: input.artisanId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('[STRIPE] Payment intent created:', paymentIntent.id);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: input.amount,
        amountInCents,
        currency: 'EUR',
        status: paymentIntent.status,
        missionId: input.missionId,
      };
    } catch (error) {
      console.error('[STRIPE] Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  });
