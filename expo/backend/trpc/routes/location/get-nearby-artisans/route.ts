import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const getNearbyArtisansProcedure = protectedProcedure
  .input(
    z.object({
      latitude: z.number(),
      longitude: z.number(),
      radius: z.number().optional().default(30),
      category: z.string().optional(),
      limit: z.number().optional().default(50),
    })
  )
  .query(async ({ input }) => {
    const { latitude, longitude, radius, category, limit } = input;

    console.log('[getNearbyArtisans] Fetching artisans near:', {
      latitude,
      longitude,
      radius,
      category,
    });

    try {
      let query = supabase
        .from('artisans')
        .select(
          `
          id,
          category,
          hourly_rate,
          travel_fee,
          intervention_radius,
          is_available,
          completed_missions,
          specialties,
          latitude,
          longitude,
          users!inner (
            id,
            name,
            email,
            phone,
            photo,
            user_type,
            rating,
            review_count
          )
        `
        )
        .eq('is_available', true)
        .eq('is_suspended', false);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: artisans, error } = await query.limit(limit);

      if (error) {
        console.error('[getNearbyArtisans] Error fetching artisans:', error);
        throw new Error('Failed to fetch nearby artisans');
      }

      if (!artisans || artisans.length === 0) {
        console.log('[getNearbyArtisans] No artisans found');
        return [];
      }

      const artisansWithDistance = artisans
        .map((artisan: any) => {
          const user = artisan.users;
          
          if (!artisan.latitude || !artisan.longitude || !user) {
            return null;
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            artisan.latitude,
            artisan.longitude
          );

          if (distance > radius) {
            return null;
          }

          return {
            id: artisan.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            photo: user.photo,
            type: 'artisan' as const,
            category: artisan.category,
            hourlyRate: artisan.hourly_rate,
            travelFee: artisan.travel_fee,
            interventionRadius: artisan.intervention_radius,
            isAvailable: artisan.is_available,
            rating: user.rating,
            reviewCount: user.review_count,
            completedMissions: artisan.completed_missions,
            specialties: artisan.specialties || [],
            location: {
              latitude: artisan.latitude,
              longitude: artisan.longitude,
            },
            distance,
          };
        })
        .filter((artisan): artisan is NonNullable<typeof artisan> => artisan !== null)
        .sort((a, b) => a.distance - b.distance);

      console.log(
        `[getNearbyArtisans] Found ${artisansWithDistance.length} artisans within ${radius}km`
      );

      return artisansWithDistance;
    } catch (error) {
      console.error('[getNearbyArtisans] Unexpected error:', error);
      throw new Error('Failed to fetch nearby artisans');
    }
  });

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
