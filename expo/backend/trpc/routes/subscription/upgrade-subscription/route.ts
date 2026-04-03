import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { SubscriptionTier } from "@/types";

const tierPrices: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 29.99,
  premium: 79.99,
};

export const upgradeSubscriptionProcedure = protectedProcedure
  .input(
    z.object({
      subscriptionId: z.string(),
      newTier: z.enum(["pro", "premium"]),
      paymentMethodId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[SUBSCRIPTION] Upgrading subscription:", input);

    const { newTier, paymentMethodId } = input;

    const proratedAmount = calculateProratedAmount("free", newTier, 1);

    console.log(`[SUBSCRIPTION] Upgrading subscription ${input.subscriptionId}`);
    console.log(`[SUBSCRIPTION] Processing prorated payment: €${proratedAmount}`);
    console.log(`[SUBSCRIPTION] Using payment method: ${paymentMethodId}`);

    const upgradedAt = new Date();
    const nextBillingDate = new Date(upgradedAt);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    return {
      success: true,
      message: `Abonnement mis à niveau vers ${newTier}!`,
      upgradedAt,
      nextBillingDate,
      proratedCharge: proratedAmount,
      newMonthlyPrice: tierPrices[newTier],
    };
  });

function calculateProratedAmount(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier,
  daysRemaining: number
): number {
  const currentPrice = tierPrices[currentTier];
  const newPrice = tierPrices[newTier];
  const dailyRate = (newPrice - currentPrice) / 30;
  return Math.round(dailyRate * daysRemaining * 100) / 100;
}
