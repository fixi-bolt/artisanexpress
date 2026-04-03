import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { mockMissions } from "@/mocks/missions";
import type { ArtisanCategory } from "@/types";

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  count: number;
  category?: ArtisanCategory;
  averagePrice: number;
}

interface HeatmapZone {
  zone: string;
  latitude: number;
  longitude: number;
  radius: number;
  missionCount: number;
  totalRevenue: number;
  averagePrice: number;
  topCategory: ArtisanCategory;
  categoryBreakdown: Record<string, number>;
}

export const getDemandHeatmapProcedure = protectedProcedure
  .input(
    z.object({
      category: z.string().optional(),
      timeRange: z.enum(["day", "week", "month", "all"]).optional(),
      minIntensity: z.number().optional(),
    })
  )
  .query(({ input }) => {
    console.log("[HEATMAP] Generating demand heatmap:", input);

    const { category, timeRange = "week", minIntensity = 1 } = input;

    const now = new Date();
    const timeFilter = (date: Date): boolean => {
      const diff = now.getTime() - date.getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      
      switch (timeRange) {
        case "day":
          return diff <= dayMs;
        case "week":
          return diff <= 7 * dayMs;
        case "month":
          return diff <= 30 * dayMs;
        default:
          return true;
      }
    };

    let filteredMissions = mockMissions.filter((m) => timeFilter(m.createdAt));
    
    if (category) {
      filteredMissions = filteredMissions.filter((m) => m.category === category);
    }

    const gridSize = 0.01;
    const heatmapData = new Map<string, HeatmapPoint>();

    filteredMissions.forEach((mission) => {
      const gridLat = Math.round(mission.location.latitude / gridSize) * gridSize;
      const gridLon = Math.round(mission.location.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLon}`;

      const existing = heatmapData.get(key);
      const price = mission.finalPrice || mission.estimatedPrice;

      if (existing) {
        existing.count += 1;
        existing.intensity += 1;
        existing.averagePrice = (existing.averagePrice * (existing.count - 1) + price) / existing.count;
      } else {
        heatmapData.set(key, {
          latitude: gridLat,
          longitude: gridLon,
          intensity: 1,
          count: 1,
          category: mission.category,
          averagePrice: price,
        });
      }
    });

    const points = Array.from(heatmapData.values())
      .filter((p) => p.intensity >= minIntensity)
      .sort((a, b) => b.intensity - a.intensity);

    const maxIntensity = Math.max(...points.map((p) => p.intensity), 1);
    const normalizedPoints = points.map((p) => ({
      ...p,
      intensity: (p.intensity / maxIntensity) * 100,
    }));

    const zones: HeatmapZone[] = [
      {
        zone: "Centre Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        radius: 2.5,
        missionCount: 156,
        totalRevenue: 23400,
        averagePrice: 150,
        topCategory: "plumber" as ArtisanCategory,
        categoryBreakdown: {
          plumber: 45,
          electrician: 38,
          locksmith: 32,
          carpenter: 25,
          painter: 16,
        },
      },
      {
        zone: "La Défense",
        latitude: 48.8922,
        longitude: 2.2381,
        radius: 2,
        missionCount: 89,
        totalRevenue: 13350,
        averagePrice: 150,
        topCategory: "electrician" as ArtisanCategory,
        categoryBreakdown: {
          electrician: 31,
          plumber: 28,
          hvac: 18,
          locksmith: 12,
        },
      },
      {
        zone: "Montparnasse",
        latitude: 48.8422,
        longitude: 2.3219,
        radius: 1.8,
        missionCount: 72,
        totalRevenue: 10080,
        averagePrice: 140,
        topCategory: "locksmith" as ArtisanCategory,
        categoryBreakdown: {
          locksmith: 28,
          plumber: 21,
          electrician: 15,
          painter: 8,
        },
      },
    ];

    const insights = {
      totalMissions: filteredMissions.length,
      hotspots: zones.slice(0, 3),
      peakHours: ["09:00-12:00", "14:00-18:00"],
      growingCategories: ["electrician", "plumber", "hvac"],
      averageResponseTime: 15,
    };

    console.log(`[HEATMAP] Generated ${normalizedPoints.length} heatmap points`);

    return {
      points: normalizedPoints,
      zones,
      insights,
      metadata: {
        timeRange,
        category: category || "all",
        generatedAt: new Date().toISOString(),
      },
    };
  });
