import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { mockArtisans } from "@/mocks/artisans";
import { mockMissions } from "@/mocks/missions";

export const getArtisanRecommendationsProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string(),
      category: z.string(),
      limit: z.number().optional(),
    })
  )
  .query(({ input }) => {
    console.log("[RECOMMENDATIONS] Getting recommendations for client:", input.clientId);

    const { clientId, category, limit = 5 } = input;

    const clientMissions = mockMissions.filter((m) => m.clientId === clientId);

    const previousArtisans = clientMissions
      .filter((m) => m.artisanId && m.status === "completed")
      .map((m) => m.artisanId);

    const categoryArtisans = mockArtisans.filter(
      (a) => a.category === category && a.isAvailable
    );

    const recommendedArtisans = categoryArtisans
      .map((artisan) => {
        let recommendationScore = 0;

        const hasWorkedBefore = previousArtisans.includes(artisan.id);
        if (hasWorkedBefore) {
          recommendationScore += 50;
        }

        const ratingScore = (artisan.rating || 0) * 15;
        recommendationScore += ratingScore;

        const experienceScore = Math.min(30, (artisan.completedMissions / 100) * 30);
        recommendationScore += experienceScore;

        const reviewScore = Math.min(20, (artisan.reviewCount || 0) / 10);
        recommendationScore += reviewScore;

        return {
          ...artisan,
          recommendationScore: Math.round(recommendationScore),
          hasWorkedBefore,
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    console.log(`[RECOMMENDATIONS] Returning ${recommendedArtisans.length} recommendations`);

    return {
      recommendations: recommendedArtisans,
      totalAvailable: categoryArtisans.length,
    };
  });
