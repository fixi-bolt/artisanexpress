import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Mission, Location, ArtisanCategory, Notification } from '@/types';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { uploadMissionPhotos } from '@/utils/uploadPhotos';

export const [MissionContext, useMissions] = createContextHook(() => {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      setMissions([]);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    loadMissions();
    loadNotifications();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    const active = missions.find(
      m => (m.status === 'in_progress' || m.status === 'accepted') && 
           (m.clientId === user?.id || m.artisanId === user?.id)
    );
    setActiveMission(active || null);
  }, [missions, user?.id]);

  const loadMissions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      let query = supabase.from('missions').select('*');

      if (user.type === 'client') {
        query = query.eq('client_id', user.id);
      } else if (user.type === 'artisan') {
        query = query.or(`artisan_id.eq.${user.id},status.eq.pending`);
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
      console.log('✅ Missions loaded:', mapped.length);
    } catch (error) {
      console.error('❌ Error loading missions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: Notification[] = (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type as Notification['type'],
        title: n.title,
        message: n.message,
        missionId: n.mission_id || undefined,
        read: n.is_read ?? n.read ?? false,
        createdAt: new Date(n.created_at),
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const newChannel = supabase
      .channel('missions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
        },
        (payload) => {
          console.log('✅ Mission updated in realtime:', payload);
          loadMissions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('✅ New notification:', payload);
          loadNotifications();
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
    if (!user || user.type !== 'client') {
      const error = new Error('Only clients can create missions');
      console.error('❌ Auth error:', error);
      throw error;
    }

    console.log('[MissionContext] Creating mission...');

    try {
      const commission = data.estimatedPrice > 150 ? 0.15 : 0.10;

      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .insert({
          client_id: user.id,
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

      if (missionError) {
        console.error('❌ Supabase error:', missionError);
        throw new Error(missionError.message || 'Failed to create mission');
      }

      console.log('✅ Mission created:', missionData.id);

      if (data.photos && data.photos.length > 0) {
        uploadMissionPhotos(data.photos, missionData.id).then(uploadResults => {
          const uploadedPhotoUrls = uploadResults.map(result => result.publicUrl);
          supabase.from('missions').update({ photos: uploadedPhotoUrls }).eq('id', missionData.id).then(() => {
            console.log('✅ Photos uploaded');
          });
        }).catch(err => {
          console.error('⚠️ Photo upload failed:', err);
        });
      }

      supabase.from('notifications').insert({
        user_id: user.id,
        type: 'mission_request',
        title: 'Nouvelle demande créée',
        message: `Demande "${data.title}" en attente d'un artisan`,
        mission_id: missionData.id,
      }).then(() => {
        console.log('✅ Notification created');
      });

      sendNotification({
        userId: user.id,
        title: 'Nouvelle demande créée',
        message: `Demande "${data.title}" en attente d'un artisan`,
        type: 'mission_request',
        missionId: missionData.id,
      });

      loadMissions();
      
      return missionData;
    } catch (error: any) {
      console.error('❌ Error in createMission:', error);
      throw error;
    }
  }, [user, sendNotification]);

  const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('missions')
        .update({
          status: 'accepted',
          artisan_id: artisanId,
          accepted_at: new Date().toISOString(),
          eta: 15,
        })
        .eq('id', missionId);

      if (updateError) throw updateError;

      const mission = missions.find(m => m.id === missionId);
      if (mission) {
        await supabase.from('notifications').insert({
          user_id: mission.clientId,
          type: 'mission_accepted',
          title: 'Mission acceptée !',
          message: 'Un artisan arrive bientôt',
          mission_id: missionId,
        });

        sendNotification({
          userId: mission.clientId,
          title: 'Mission acceptée !',
          message: 'Un artisan arrive bientôt',
          type: 'mission_accepted',
          missionId,
        });
      }

      await loadMissions();
      console.log('✅ Mission accepted:', missionId);
    } catch (error) {
      console.error('❌ Error accepting mission:', error);
      throw error;
    }
  }, [missions, sendNotification]);

  const startMission = useCallback(async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('missions')
        .update({ status: 'in_progress', eta: 0 })
        .eq('id', missionId);

      if (error) throw error;

      await loadMissions();
      console.log('✅ Mission started:', missionId);
    } catch (error) {
      console.error('❌ Error starting mission:', error);
      throw error;
    }
  }, []);

  const completeMission = useCallback(async (missionId: string, finalPrice: number) => {
    try {
      const { error: updateError } = await supabase
        .from('missions')
        .update({
          status: 'completed',
          final_price: finalPrice,
          completed_at: new Date().toISOString(),
        })
        .eq('id', missionId);

      if (updateError) throw updateError;

      const mission = missions.find(m => m.id === missionId);
      if (mission) {
        await supabase.from('notifications').insert({
          user_id: mission.clientId,
          type: 'mission_completed',
          title: 'Mission terminée',
          message: `Montant: ${finalPrice}€. Notez votre artisan !`,
          mission_id: missionId,
        });

        sendNotification({
          userId: mission.clientId,
          title: 'Mission terminée',
          message: `Montant: ${finalPrice}€. Notez votre artisan !`,
          type: 'mission_completed',
          missionId,
        });
      }

      await loadMissions();
      console.log('✅ Mission completed:', missionId, finalPrice);
    } catch (error) {
      console.error('❌ Error completing mission:', error);
      throw error;
    }
  }, [missions, sendNotification]);

  const cancelMission = useCallback(async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('missions')
        .update({ status: 'cancelled' })
        .eq('id', missionId);

      if (error) throw error;

      await loadMissions();
      console.log('✅ Mission cancelled:', missionId);
    } catch (error) {
      console.error('❌ Error cancelling mission:', error);
      throw error;
    }
  }, []);

  const updateArtisanLocation = useCallback(async (missionId: string, location: Location) => {
    try {
      const { error } = await supabase
        .from('missions')
        .update({
          artisan_latitude: location.latitude,
          artisan_longitude: location.longitude,
        })
        .eq('id', missionId);

      if (error) throw error;

      await loadMissions();
    } catch (error) {
      console.error('❌ Error updating artisan location:', error);
    }
  }, []);

  const getUserMissions = () => {
    if (!user) return [];
    
    if (user.type === 'client') {
      return missions.filter(m => m.clientId === user.id);
    } else {
      return missions.filter(m => m.artisanId === user.id);
    }
  };

  const getPendingMissionsForArtisan = () => {
    if (!user || user.type !== 'artisan') return [];
    
    return missions.filter(m => 
      m.status === 'pending' && 
      m.category === (user as any).category
    );
  };

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, []);

  const unreadNotificationsCount = notifications.filter(n => 
    n.userId === user?.id && !n.read
  ).length;

  return useMemo(() => ({
    missions,
    activeMission,
    notifications,
    unreadNotificationsCount,
    isLoading,
    createMission,
    acceptMission,
    startMission,
    completeMission,
    cancelMission,
    updateArtisanLocation,
    getUserMissions,
    getPendingMissionsForArtisan,
    markNotificationAsRead,
    refreshMissions: loadMissions,
    refreshNotifications: loadNotifications,
  }), [
    missions,
    activeMission,
    notifications,
    isLoading,
    user?.id,
    createMission,
    acceptMission,
    startMission,
    completeMission,
    cancelMission,
    updateArtisanLocation,
    markNotificationAsRead,
  ]);
});
