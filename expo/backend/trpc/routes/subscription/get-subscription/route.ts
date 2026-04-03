import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Subscription } from "@/types";

export const getSubscriptionProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
    })
  )
  .query(({ input }) => {
    console.log("[SUBSCRIPTION] Getting subscription for artisan:", input.artisanId);

    const mockSubscription: Subscription = {
      id: "sub-123",
      artisanId: input.artisanId,
      tier: "free",
      status: "active",
      startDate: new Date("2025-01-01"),
      commission: 0.15,
      features: ["Accès de base", "5 missions/mois", "Support standard"],
      monthlyPrice: 0,
    };

    return {
      subscription: mockSubscription,
      canUpgrade: mockSubscription.tier !== "premium",
      usage: {
        missionsThisMonth: 3,
        missionsLimit: mockSubscription.tier === "free" ? 5 : null,
        commissionSaved: 0,
      },
    };
  });
