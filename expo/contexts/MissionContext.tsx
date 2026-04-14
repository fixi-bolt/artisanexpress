import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadMissions = useCallback(async () => {
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
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: Notification[] = (data || []).map(n => {
        const jsonData = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {});
        return {
          id: n.id,
          userId: n.user_id,
          type: n.type as Notification['type'],
          title: n.title,
          message: n.message,
          missionId: jsonData?.mission_id || undefined,
          read: !!n.read,
          createdAt: new Date(n.created_at),
        };
      });

      setNotifications(mapped);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  }, [user]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return null;

    const newChannel = supabase
      .channel(`missions-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
        },
        (payload) => {
          console.log('🔔 Realtime: Mission changed', payload);
          void loadMissions();
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
          console.log('🔔 Realtime: New notification received!', payload);
          console.log('🔔 Notification data:', payload.new);
          void loadNotifications();
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime is active for user:', user.id);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error!');
        }
      });

    return newChannel;
  }, [user, loadMissions, loadNotifications]);

  useEffect(() => {
    if (!user) {
      setMissions([]);
      setNotifications([]);
      setIsLoading(false);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    let currentChannel: RealtimeChannel | null = null;

    const initializeData = async () => {
      console.log('🚀 Initializing MissionContext for user:', user.id, 'type:', user.type);
      
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      const newChannel = setupRealtimeSubscription();
      currentChannel = newChannel;
      channelRef.current = newChannel;
      
      void Promise.all([loadMissions(), loadNotifications()]).catch(err => {
        console.error('❌ Error initializing mission data:', err);
      });
    };

    const timeoutId = setTimeout(() => {
      void initializeData();
    }, 100);

    return () => {
      console.log('🧹 Cleaning up realtime channel');
      clearTimeout(timeoutId);
      if (currentChannel) {
        void supabase.removeChannel(currentChannel);
        channelRef.current = null;
      }
    };
  }, [user, setupRealtimeSubscription, loadMissions, loadNotifications]);

  useEffect(() => {
    const active = missions.find(
      m => (m.status === 'in_progress' || m.status === 'accepted') && 
           (m.clientId === user?.id || m.artisanId === user?.id)
    );
    setActiveMission(active || null);
  }, [missions, user?.id]);

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

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'mission_request',
        title: 'Nouvelle demande créée',
        message: `Demande "${data.title}" en attente d'un artisan`,
        data: { mission_id: missionData.id },
        read: false,
      });
      
      return missionData;
    } catch (error: any) {
      console.error('❌ Error in createMission:', error);
      throw error;
    }
  }, [user]);

  const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
    try {
      console.log('🎯 Accepting mission:', missionId, 'by artisan:', artisanId);
      
      const { error: updateError } = await supabase
        .from('missions')
        .update({
          status: 'accepted',
          artisan_id: artisanId,
          accepted_at: new Date().toISOString(),
          eta: 15,
        })
        .eq('id', missionId);

      if (updateError) {
        console.error('❌ Error updating mission:', updateError);
        throw updateError;
      }

      console.log('✅ Mission accepted:', missionId);
      console.log('✅ Trigger SQL will automatically create notification for client');
      console.log('✅ Push notification will be sent by backend');
      
      await loadMissions();
    } catch (error) {
      console.error('❌ Error accepting mission:', error);
      throw error;
    }
  }, [loadMissions]);

  const startMission = useCallback(async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('missions')
        .update({ status: 'in_progress', eta: 0 })
        .eq('id', missionId);

      if (error) throw error;

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
          data: { mission_id: missionId },
          read: false,
        });

        void sendNotification({
          userId: mission.clientId,
          title: 'Mission terminée',
          message: `Montant: ${finalPrice}€. Notez votre artisan !`,
          type: 'mission_completed',
          missionId,
        });
      }

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
    } catch (error) {
      console.error('❌ Error updating artisan location:', error);
    }
  }, []);

  const getUserMissions = useCallback(() => {
    if (!user) return [];
    
    if (user.type === 'client') {
      return missions.filter(m => m.clientId === user.id);
    } else {
      return missions.filter(m => m.artisanId === user.id);
    }
  }, [missions, user]);

  const getPendingMissionsForArtisan = useCallback(() => {
    if (!user || user.type !== 'artisan') return [];
    
    return missions.filter(m => 
      m.status === 'pending' && 
      m.category === (user as any).category
    );
  }, [missions, user]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, []);

  const unreadNotificationsCount = useMemo(() => 
    notifications.filter(n => n.userId === user?.id && !n.read).length,
    [notifications, user?.id]
  );

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
    loadMissions,
    loadNotifications,
  ]);
});
