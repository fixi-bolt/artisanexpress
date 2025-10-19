import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mission, ArtisanCategory, Location } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabaseMissions = (userId?: string, userType?: 'client' | 'artisan' | 'admin') => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) {
      setMissions([]);
      setIsLoading(false);
      return;
    }

    loadMissions();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, userType]);

  const loadMissions = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      let query = supabase.from('missions').select('*');

      if (userType === 'client') {
        query = query.eq('client_id', userId);
      } else if (userType === 'artisan') {
        query = query.or(`artisan_id.eq.${userId},status.eq.pending`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Mission[] = (data || []).map(m => ({
        id: m.id,
        clientId: m.client_id,
        artisanId: m.artisan_id || undefined,
        category: m.category as ArtisanCategory,
        title: m.title,
        description: m.description,
        photos: m.photos,
        location: {
          latitude: m.latitude,
          longitude: m.longitude,
          address: m.address || undefined,
        },
        status: m.status as Mission['status'],
        estimatedPrice: m.estimated_price,
        finalPrice: m.final_price || undefined,
        commission: m.commission,
        createdAt: new Date(m.created_at),
        acceptedAt: m.accepted_at ? new Date(m.accepted_at) : undefined,
        completedAt: m.completed_at ? new Date(m.completed_at) : undefined,
        eta: m.eta || undefined,
        artisanLocation: m.artisan_latitude && m.artisan_longitude
          ? { latitude: m.artisan_latitude, longitude: m.artisan_longitude }
          : undefined,
      }));

      setMissions(mapped);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userId) return;

    const newChannel = supabase
      .channel('missions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
        },
        () => {
          loadMissions();
        }
      )
      .subscribe();

    setChannel(newChannel);
  };

  const createMission = useCallback(async (data: {
    category: ArtisanCategory;
    title: string;
    description: string;
    photos?: string[];
    location: Location;
    estimatedPrice: number;
  }) => {
    if (!userId || userType !== 'client') {
      throw new Error('Only clients can create missions');
    }

    const commission = data.estimatedPrice > 150 ? 0.15 : 0.10;

    const { data: missionData, error } = await supabase
      .from('missions')
      .insert({
        client_id: userId,
        category: data.category,
        title: data.title,
        description: data.description,
        photos: data.photos || [],
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address,
        status: 'pending',
        estimated_price: data.estimatedPrice,
        commission,
      })
      .select()
      .single();

    if (error) throw error;

    await loadMissions();
    return missionData;
  }, [userId, userType]);

  const acceptMission = useCallback(async (missionId: string) => {
    if (!userId || userType !== 'artisan') {
      throw new Error('Only artisans can accept missions');
    }

    const { error } = await supabase
      .from('missions')
      .update({
        status: 'accepted',
        artisan_id: userId,
        accepted_at: new Date().toISOString(),
        eta: 15,
      })
      .eq('id', missionId);

    if (error) throw error;
    await loadMissions();
  }, [userId, userType]);

  const updateMissionStatus = useCallback(async (
    missionId: string,
    status: Mission['status'],
    additionalData?: { finalPrice?: number }
  ) => {
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      if (additionalData?.finalPrice) {
        updateData.final_price = additionalData.finalPrice;
      }
    }

    const { error } = await supabase
      .from('missions')
      .update(updateData)
      .eq('id', missionId);

    if (error) throw error;
    await loadMissions();
  }, []);

  const updateArtisanLocation = useCallback(async (
    missionId: string,
    location: Location
  ) => {
    const { error } = await supabase
      .from('missions')
      .update({
        artisan_latitude: location.latitude,
        artisan_longitude: location.longitude,
      })
      .eq('id', missionId);

    if (error) throw error;
    await loadMissions();
  }, []);

  return {
    missions,
    isLoading,
    createMission,
    acceptMission,
    updateMissionStatus,
    updateArtisanLocation,
    refreshMissions: loadMissions,
  };
};
