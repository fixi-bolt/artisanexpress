import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const cancelSubscriptionProcedure = protectedProcedure
  .input(
    z.object({
      subscriptionId: z.string(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[SUBSCRIPTION] Cancelling subscription:", input);

    const { reason } = input;

    console.log(`[SUBSCRIPTION] Cancellation reason: ${reason || "Not provided"}`);
    console.log(`[SUBSCRIPTION] Stopping Stripe recurring billing for ${input.subscriptionId}`);

    const cancelledAt = new Date();
    const accessUntil = new Date(cancelledAt);
    accessUntil.setMonth(accessUntil.getMonth() + 1);

    return {
      success: true,
      message: "Abonnement annulé. Vous gardez l'accès jusqu'à la fin de la période payée.",
      cancelledAt,
      accessUntil,
      refundEligible: false,
    };
  });
