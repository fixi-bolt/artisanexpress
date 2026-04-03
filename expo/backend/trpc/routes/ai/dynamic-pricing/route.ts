import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const dynamicPricingProcedure = protectedProcedure
  .input(
    z.object({
      basePrice: z.number().min(0),
      category: z.string(),
      artisanRatingAvg: z.number().min(0).max(5).optional().default(4),
      distanceKm: z.number().min(0).optional().default(5),
      demandIndex: z.number().min(0).max(1).optional().default(0.4),
      hourOfDay: z.number().min(0).max(23).optional(),
      isWeekend: z.boolean().optional(),
      urgency: z.enum(["low", "medium", "high"]).optional().default("medium"),
    })
  )
  .mutation(async ({ input }) => {
    const now = new Date();
    const hour = input.hourOfDay ?? now.getHours();
    const weekend = input.isWeekend ?? [0, 6].includes(now.getDay());

    let surge = 1;

    if (hour >= 19 || hour < 7) surge += 0.25;
    if (weekend) surge += 0.15;

    surge += input.demandIndex * 0.5;

    const ratingBoost = (input.artisanRatingAvg - 4) * 0.05; // +/-5% per star over 4
    surge += ratingBoost;

    const distanceFee = Math.min(1 + input.distanceKm * 0.02, 1.4);

    const urgencyMap = { low: 0.95, medium: 1, high: 1.2 } as const;
    const urgencyFactor = urgencyMap[input.urgency];

    const raw = input.basePrice * surge * distanceFee * urgencyFactor;
    const serviceFee = Math.max(2, raw * 0.05);
    const platformFee = Math.max(1, raw * 0.03);

    const total = Math.round((raw + serviceFee + platformFee) * 100) / 100;

    return {
      breakdown: {
        basePrice: input.basePrice,
        surge: Number(surge.toFixed(2)),
        distanceFee: Number(distanceFee.toFixed(2)),
        urgencyFactor,
        serviceFee: Number(serviceFee.toFixed(2)),
        platformFee: Number(platformFee.toFixed(2)),
      },
      total,
      currency: "EUR",
      disclaimer:
        "Tarif dynamique basé sur la demande, l'heure et la distance. Le prix final est confirmé par l'artisan.",
    };
  });
