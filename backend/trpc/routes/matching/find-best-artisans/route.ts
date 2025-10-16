import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { mockArtisans } from "@/mocks/artisans";
import type { Artisan, Location } from "@/types";

const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371;
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) *
    Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface ArtisanMatch extends Artisan {
  matchScore: number;
  distance: number;
  estimatedArrival: number;
}

export const findBestArtisansProcedure = protectedProcedure
  .input(
    z.object({
      category: z.string(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      urgency: z.enum(["low", "medium", "high"]).optional(),
      maxDistance: z.number().optional(),
    })
  )
  .query(({ input }) => {
    console.log("[MATCHING] Finding best artisans for:", input);

    const { category, location, urgency = "medium", maxDistance = 50 } = input;

    const availableArtisans = mockArtisans.filter(
      (artisan) =>
        artisan.category === category &&
        artisan.isAvailable &&
        artisan.location
    );

    const matches: ArtisanMatch[] = availableArtisans
      .map((artisan) => {
        const distance = calculateDistance(location, artisan.location!);
        
        if (distance > artisan.interventionRadius || distance > maxDistance) {
          return null;
        }

        let matchScore = 0;

        const distanceScore = Math.max(0, 100 - distance * 2);
        matchScore += distanceScore * 0.4;

        const ratingScore = (artisan.rating || 0) * 20;
        matchScore += ratingScore * 0.3;

        const experienceScore = Math.min(100, (artisan.completedMissions / 200) * 100);
        matchScore += experienceScore * 0.2;

        const urgencyMultiplier = urgency === "high" ? 1.5 : urgency === "medium" ? 1.2 : 1;
        const availabilityScore = artisan.isAvailable ? 100 : 0;
        matchScore += (availabilityScore * 0.1) * urgencyMultiplier;

        const estimatedArrival = Math.round((distance / 40) * 60);

        return {
          ...artisan,
          matchScore: Math.round(matchScore),
          distance: Math.round(distance * 10) / 10,
          estimatedArrival,
        };
      })
      .filter((match): match is ArtisanMatch => match !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    console.log(`[MATCHING] Found ${matches.length} matches, best score: ${matches[0]?.matchScore || 0}`);

    return {
      matches,
      totalAvailable: availableArtisans.length,
      algorithm: {
        weights: {
          distance: 0.4,
          rating: 0.3,
          experience: 0.2,
          availability: 0.1,
        },
        urgencyMultiplier: urgency === "high" ? 1.5 : urgency === "medium" ? 1.2 : 1,
      },
    };
  });
