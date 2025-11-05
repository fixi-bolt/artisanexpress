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
        .from('users')
        .select(
          `
          id,
          name,
          email,
          phone,
          photo,
          user_type,
          artisan_profiles (
            category,
            hourly_rate,
            travel_fee,
            intervention_radius,
            is_available,
            rating,
            review_count,
            completed_missions,
            specialties,
            latitude,
            longitude
          )
        `
        )
        .eq('user_type', 'artisan')
        .eq('artisan_profiles.is_available', true)
        .not('artisan_profiles', 'is', null);

      if (category) {
        query = query.eq('artisan_profiles.category', category);
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
          const profile = artisan.artisan_profiles?.[0];
          
          if (!profile || !profile.latitude || !profile.longitude) {
            return null;
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            profile.latitude,
            profile.longitude
          );

          if (distance > radius) {
            return null;
          }

          return {
            id: artisan.id,
            name: artisan.name,
            email: artisan.email,
            phone: artisan.phone,
            photo: artisan.photo,
            type: 'artisan' as const,
            category: profile.category,
            hourlyRate: profile.hourly_rate,
            travelFee: profile.travel_fee,
            interventionRadius: profile.intervention_radius,
            isAvailable: profile.is_available,
            rating: profile.rating,
            reviewCount: profile.review_count,
            completedMissions: profile.completed_missions,
            specialties: profile.specialties || [],
            location: {
              latitude: profile.latitude,
              longitude: profile.longitude,
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
