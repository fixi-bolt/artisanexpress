import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const getNearbyMissionsInput = z.object({
  artisanId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const missionResponseSchema = z.object({
  mission_id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  estimated_price: z.number().nullable(),
  address: z.string(),
  client_id: z.string().uuid(),
  client_name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  photos: z.array(z.string()).default([]),
  distance_km: z.string().or(z.number()),
  created_at: z.string().datetime(),
});

export const getNearbyMissionsProcedure = protectedProcedure
  .input(getNearbyMissionsInput)
  .query(async ({ input, ctx }) => {
    console.log("[get-nearby-missions] Fetching nearby missions:", {
      artisanId: input.artisanId,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    if (ctx.session.user.id !== input.artisanId) {
      console.warn("[get-nearby-missions] Unauthorized access attempt:", {
        userId: ctx.session.user.id,
        requestedArtisanId: input.artisanId,
      });
      throw new Error("Unauthorized access to artisan missions");
    }

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

      const missions = (data || []).map((mission: unknown) => {
        try {
          const validatedMission = missionResponseSchema.parse(mission);
          
          return {
            id: validatedMission.mission_id,
            title: validatedMission.title,
            category: validatedMission.category,
            description: validatedMission.description,
            status: validatedMission.status,
            estimatedPrice: validatedMission.estimated_price,
            address: validatedMission.address,
            clientId: validatedMission.client_id,
            clientName: validatedMission.client_name,
            location: {
              latitude: validatedMission.latitude,
              longitude: validatedMission.longitude,
              address: validatedMission.address,
            },
            photos: validatedMission.photos,
            distanceKm: typeof validatedMission.distance_km === 'string' 
              ? parseFloat(validatedMission.distance_km) 
              : validatedMission.distance_km,
            createdAt: new Date(validatedMission.created_at),
          };
        } catch (validationError) {
          console.error("[get-nearby-missions] Invalid mission data:", validationError);
          return null;
        }
      }).filter((mission): mission is NonNullable<typeof mission> => mission !== null);

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
