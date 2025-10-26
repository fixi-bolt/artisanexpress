import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const getNearbyMissionsInput = z.object({
  artisanId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const getNearbyMissionsProcedure = protectedProcedure
  .input(getNearbyMissionsInput)
  .query(async ({ input }) => {
    console.log("[get-nearby-missions] Fetching nearby missions:", {
      artisanId: input.artisanId,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    try {
      const { data, error } = await supabase.rpc("find_nearby_missions", {
        p_artisan_id: input.artisanId,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
      });

      if (error) {
        console.error("[get-nearby-missions] Error fetching missions:", error);
        throw new Error(`Failed to fetch nearby missions: ${error.message}`);
      }

      console.log(
        `[get-nearby-missions] Found ${data?.length || 0} nearby missions`
      );

      const missions = (data || []).map((mission: any) => ({
        id: mission.mission_id,
        title: mission.title,
        category: mission.category,
        description: mission.description,
        status: mission.status,
        estimatedPrice: mission.estimated_price,
        address: mission.address,
        clientId: mission.client_id,
        clientName: mission.client_name,
        location: {
          latitude: mission.latitude,
          longitude: mission.longitude,
          address: mission.address,
        },
        photos: mission.photos || [],
        distanceKm: parseFloat(mission.distance_km || "0"),
        createdAt: new Date(mission.created_at),
      }));

      return {
        success: true,
        missions,
        count: missions.length,
        radius: 20,
      };
    } catch (err) {
      console.error("[get-nearby-missions] Unexpected error:", err);
      throw err;
    }
  });
