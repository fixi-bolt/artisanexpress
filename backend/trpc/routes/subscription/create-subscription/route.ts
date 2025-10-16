import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Subscription, SubscriptionTier } from "@/types";

const subscriptionPlans: Record<SubscriptionTier, { commission: number; features: string[]; monthlyPrice: number }> = {
  free: {
    commission: 0.15,
    features: ["Accès de base", "5 missions/mois", "Support standard"],
    monthlyPrice: 0,
  },
  pro: {
    commission: 0.10,
    features: [
      "Visibilité prioritaire",
      "Missions illimitées",
      "Commission réduite 10%",
      "Badge Pro",
      "Support prioritaire",
      "Statistiques avancées",
    ],
    monthlyPrice: 29.99,
  },
  premium: {
    commission: 0.05,
    features: [
      "Visibilité maximale",
      "Missions illimitées",
      "Commission réduite 5%",
      "Badge Premium",
      "Support dédié 24/7",
      "Statistiques avancées",
      "Formation mensuelle",
      "Publicité sponsorisée",
    ],
    monthlyPrice: 79.99,
  },
};

export const createSubscriptionProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
      tier: z.enum(["free", "pro", "premium"]),
      paymentMethodId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[SUBSCRIPTION] Creating subscription:", input);

    const { artisanId, tier, paymentMethodId } = input;

    if (tier !== "free" && !paymentMethodId) {
      throw new Error("Payment method required for paid subscriptions");
    }

    const plan = subscriptionPlans[tier];
    
    const subscription: Subscription = {
      id: `sub-${Date.now()}`,
      artisanId,
      tier,
      status: "active",
      startDate: new Date(),
      commission: plan.commission,
      features: plan.features,
      monthlyPrice: plan.monthlyPrice,
    };

    if (tier !== "free") {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      subscription.endDate = endDate;

      console.log(`[SUBSCRIPTION] Processing payment of €${plan.monthlyPrice} via Stripe`);
    }

    console.log("[SUBSCRIPTION] Subscription created successfully:", subscription.id);

    return {
      subscription,
      paymentRequired: tier !== "free",
      message: tier === "free" 
        ? "Abonnement gratuit activé"
        : `Abonnement ${tier} activé. Prochain paiement: ${subscription.endDate?.toLocaleDateString()}`,
    };
  });
