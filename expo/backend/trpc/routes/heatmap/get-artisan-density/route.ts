import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { mockArtisans } from "@/mocks/artisans";

interface DensityPoint {
  latitude: number;
  longitude: number;
  artisanCount: number;
  categories: string[];
  averageRating: number;
  availabilityRate: number;
}

export const getArtisanDensityProcedure = protectedProcedure
  .input(
    z.object({
      category: z.string().optional(),
      bounds: z
        .object({
          north: z.number(),
          south: z.number(),
          east: z.number(),
          west: z.number(),
        })
        .optional(),
    })
  )
  .query(({ input }) => {
    console.log("[DENSITY] Calculating artisan density:", input);

    const { category, bounds } = input;

    let filteredArtisans = mockArtisans.filter((a) => a.location);

    if (category) {
      filteredArtisans = filteredArtisans.filter((a) => a.category === category);
    }

    if (bounds) {
      filteredArtisans = filteredArtisans.filter(
        (a) =>
          a.location &&
          a.location.latitude >= bounds.south &&
          a.location.latitude <= bounds.north &&
          a.location.longitude >= bounds.west &&
          a.location.longitude <= bounds.east
      );
    }

    const gridSize = 0.02;
    const densityMap = new Map<string, DensityPoint>();

    filteredArtisans.forEach((artisan) => {
      if (!artisan.location) return;

      const gridLat = Math.round(artisan.location.latitude / gridSize) * gridSize;
      const gridLon = Math.round(artisan.location.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLon}`;

      const existing = densityMap.get(key);

      if (existing) {
        existing.artisanCount += 1;
        if (!existing.categories.includes(artisan.category)) {
          existing.categories.push(artisan.category);
        }
        existing.averageRating =
          (existing.averageRating * (existing.artisanCount - 1) + (artisan.rating || 0)) /
          existing.artisanCount;
        existing.availabilityRate =
          (existing.availabilityRate * (existing.artisanCount - 1) + (artisan.isAvailable ? 1 : 0)) /
          existing.artisanCount;
      } else {
        densityMap.set(key, {
          latitude: gridLat,
          longitude: gridLon,
          artisanCount: 1,
          categories: [artisan.category],
          averageRating: artisan.rating || 0,
          availabilityRate: artisan.isAvailable ? 1 : 0,
        });
      }
    });

    const densityPoints = Array.from(densityMap.values()).sort(
      (a, b) => b.artisanCount - a.artisanCount
    );

    const analysis = {
      totalArtisans: filteredArtisans.length,
      averageDensity: filteredArtisans.length / Math.max(densityPoints.length, 1),
      highDensityZones: densityPoints.filter((p) => p.artisanCount >= 3).length,
      lowDensityZones: densityPoints.filter((p) => p.artisanCount === 1).length,
      categoryDistribution: filteredArtisans.reduce(
        (acc, a) => {
          acc[a.category] = (acc[a.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    console.log(`[DENSITY] Found ${densityPoints.length} density zones`);

    return {
      densityPoints,
      analysis,
      metadata: {
        gridSize,
        category: category || "all",
        bounds,
      },
    };
  });
