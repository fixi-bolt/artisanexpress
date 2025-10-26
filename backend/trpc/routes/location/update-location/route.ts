import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const updateLocationInput = z.object({
  artisanId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
});

export const updateLocationProcedure = protectedProcedure
  .input(updateLocationInput)
  .mutation(async ({ input }) => {
    console.log("[update-location] Updating artisan location:", {
      artisanId: input.artisanId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
    });

    try {
      const { data, error } = await supabase.rpc("update_artisan_location", {
        p_artisan_id: input.artisanId,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
      });

      if (error) {
        console.error("[update-location] Error updating location:", error);
        throw new Error(`Failed to update location: ${error.message}`);
      }

      if (!data) {
        console.error("[update-location] Artisan not found");
        throw new Error("Artisan not found");
      }

      console.log("[update-location] Location updated successfully");

      return {
        success: true,
        message: "Location updated successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("[update-location] Unexpected error:", err);
      throw err;
    }
  });
