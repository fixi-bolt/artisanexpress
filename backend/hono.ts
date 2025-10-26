import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.post("/webhooks/stripe", async (c) => {
  console.log('[STRIPE WEBHOOK] Received webhook');
  
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature') || '';

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    console.log('[STRIPE WEBHOOK] Event type:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[STRIPE WEBHOOK] Payment succeeded:', paymentIntent.id);

        const missionId = paymentIntent.metadata.mission_id;
        const artisanId = paymentIntent.metadata.artisan_id;
        const clientId = paymentIntent.metadata.client_id;

        if (missionId && artisanId && clientId) {
          const amount = paymentIntent.amount / 100;
          const commission = Number(process.env.COMMISSION_PERCENTAGE || 0.15);
          const commissionAmount = amount * commission;
          const artisanPayout = amount - commissionAmount;

          await supabase.from('transactions').insert({
            mission_id: missionId,
            client_id: clientId,
            artisan_id: artisanId,
            amount,
            commission_amount: commissionAmount,
            artisan_payout: artisanPayout,
            status: 'completed',
            payment_method: 'card',
            payment_intent_id: paymentIntent.id,
          });

          await supabase.rpc('credit_artisan_wallet', {
            p_artisan_id: artisanId,
            p_amount: artisanPayout,
          });

          await supabase
            .from('missions')
            .update({
              status: 'completed',
              payment_status: 'paid',
            })
            .eq('id', missionId);

          await supabase.from('notifications').insert({
            user_id: artisanId,
            type: 'payment_received',
            title: 'Paiement reçu',
            message: `Vous avez reçu ${artisanPayout.toFixed(2)}€ pour la mission`,
            mission_id: missionId,
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[STRIPE WEBHOOK] Payment failed:', paymentIntent.id);

        const missionId = paymentIntent.metadata.mission_id;
        if (missionId) {
          await supabase
            .from('missions')
            .update({
              payment_status: 'failed',
            })
            .eq('id', missionId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('[STRIPE WEBHOOK] Charge refunded:', charge.id);

        const paymentIntentId = charge.payment_intent as string;
        if (paymentIntentId) {
          await supabase
            .from('transactions')
            .update({
              status: 'refunded',
            })
            .eq('payment_intent_id', paymentIntentId);
        }
        break;
      }

      default:
        console.log('[STRIPE WEBHOOK] Unhandled event type:', event.type);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error processing webhook:', error);
    return c.json({ error: 'Webhook processing failed' }, 400);
  }
});

export default app;
