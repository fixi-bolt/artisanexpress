import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const processPaymentProcedure = protectedProcedure
  .input(
    z.object({
      missionId: z.string(),
      paymentIntentId: z.string(),
      clientId: z.string(),
      artisanId: z.string(),
      amount: z.number().positive(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[STRIPE] Processing payment for mission:', input.missionId);

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);

      console.log('[STRIPE] Payment intent status:', paymentIntent.status);

      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: 'Payment not completed. Please try again.',
        };
      }

      const commission = Number(process.env.COMMISSION_PERCENTAGE || 0.15);
      const commissionAmount = input.amount * commission;
      const artisanPayout = input.amount - commissionAmount;

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          mission_id: input.missionId,
          client_id: input.clientId,
          artisan_id: input.artisanId,
          amount: input.amount,
          commission_amount: commissionAmount,
          artisan_payout: artisanPayout,
          status: 'completed',
          payment_method: 'card',
          payment_intent_id: input.paymentIntentId,
        })
        .select()
        .single();

      if (txError) {
        console.error('[STRIPE] Error creating transaction:', txError);
        throw new Error('Failed to create transaction record');
      }

      const { error: walletError } = await supabase.rpc('credit_artisan_wallet', {
        p_artisan_id: input.artisanId,
        p_amount: artisanPayout,
      });

      if (walletError) {
        console.error('[STRIPE] Error crediting wallet:', walletError);
      }

      const { error: missionError } = await supabase
        .from('missions')
        .update({
          status: 'completed',
          payment_status: 'paid',
        })
        .eq('id', input.missionId);

      if (missionError) {
        console.error('[STRIPE] Error updating mission:', missionError);
      }

      console.log('[STRIPE] Payment processed successfully:', transaction.id);

      return {
        success: true,
        transactionId: transaction.id,
        artisanPayout,
      };
    } catch (error) {
      console.error('[STRIPE] Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  });
