import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Artisan, ArtisanCategory } from '@/types';

export const useSupabaseArtisans = (filters?: {
  category?: ArtisanCategory;
  isAvailable?: boolean;
  location?: { latitude: number; longitude: number; radius?: number };
}) => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadArtisans();
  }, [filters?.category, filters?.isAvailable]);

  const loadArtisans = async () => {
    try {
      console.log('[useSupabaseArtisans] Loading artisans with filters:', filters);
      setIsLoading(true);

      let query = supabase
        .from('artisans')
        .select(`
          *,
          users!inner (
            id,
            name,
            email,
            phone,
            photo,
            rating,
            review_count
          )
        `);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.isAvailable !== undefined) {
        query = query.eq('is_available', filters.isAvailable);
      }

      query = query.eq('is_suspended', false);

      const { data, error } = await query;

      if (error) {
        console.error('[useSupabaseArtisans] Error fetching artisans:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      let mapped: Artisan[] = (data || []).map((a: any) => ({
        id: a.id,
        name: a.users.name,
        email: a.users.email,
        phone: a.users.phone || '',
        photo: a.users.photo,
        type: 'artisan' as const,
        rating: a.users.rating,
        reviewCount: a.users.review_count,
        category: a.category,
        hourlyRate: a.hourly_rate,
        travelFee: a.travel_fee,
        interventionRadius: a.intervention_radius,
        isAvailable: a.is_available,
        completedMissions: a.completed_missions,
        specialties: a.specialties,
        location: a.latitude && a.longitude
          ? { latitude: a.latitude, longitude: a.longitude }
          : undefined,
        isSuspended: a.is_suspended,
      }));

      if (filters?.location && filters.location.radius) {
        const { latitude, longitude, radius } = filters.location;
        mapped = mapped.filter(artisan => {
          if (!artisan.location) return false;

          const distance = calculateDistance(
            latitude,
            longitude,
            artisan.location.latitude,
            artisan.location.longitude
          );

          return distance <= radius;
        });
      }

      mapped.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      console.log(`[useSupabaseArtisans] Loaded ${mapped.length} artisans`);
      setArtisans(mapped);
    } catch (error: any) {
      console.error('[useSupabaseArtisans] Error loading artisans:', {
        message: error?.message || 'Unknown error',
        details: error?.details || '',
        hint: error?.hint || '',
        code: error?.code || '',
        stack: error?.stack || '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getArtisanById = useCallback(async (artisanId: string) => {
    const { data, error } = await supabase
      .from('artisans')
      .select(`
        *,
        users!inner (
          id,
          name,
          email,
          phone,
          photo,
          rating,
          review_count
        )
      `)
      .eq('id', artisanId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Artisan not found');

    const artisan: Artisan = {
      id: data.id,
      name: data.users.name,
      email: data.users.email,
      phone: data.users.phone || '',
      photo: data.users.photo,
      type: 'artisan',
      rating: data.users.rating,
      reviewCount: data.users.review_count,
      category: data.category,
      hourlyRate: data.hourly_rate,
      travelFee: data.travel_fee,
      interventionRadius: data.intervention_radius,
      isAvailable: data.is_available,
      completedMissions: data.completed_missions,
      specialties: data.specialties,
      location: data.latitude && data.longitude
        ? { latitude: data.latitude, longitude: data.longitude }
        : undefined,
      isSuspended: data.is_suspended,
    };

    return artisan;
  }, []);

  const updateArtisanAvailability = useCallback(async (
    artisanId: string,
    isAvailable: boolean
  ) => {
    const { error } = await supabase
      .from('artisans')
      .update({ is_available: isAvailable })
      .eq('id', artisanId);

    if (error) throw error;
    await loadArtisans();
  }, []);

  return {
    artisans,
    isLoading,
    getArtisanById,
    updateArtisanAvailability,
    refreshArtisans: loadArtisans,
  };
};
