import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import { Mission, Location, ArtisanCategory, Notification } from '@/types';
import { mockMissions } from '@/mocks/missions';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export const [MissionContext, useMissions] = createContextHook(() => {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [missions, setMissions] = useState<Mission[]>(mockMissions);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const active = missions.find(
      m => (m.status === 'in_progress' || m.status === 'accepted') && 
           (m.clientId === user?.id || m.artisanId === user?.id)
    );
    setActiveMission(active || null);
  }, [missions, user?.id]);

  const createMission = (data: {
    category: ArtisanCategory;
    title: string;
    description: string;
    photos?: string[];
    location: Location;
    estimatedPrice: number;
  }) => {
    const newMission: Mission = {
      id: `mis-${Date.now()}`,
      clientId: user?.id || 'cli-1',
      category: data.category,
      title: data.title,
      description: data.description,
      photos: data.photos,
      location: data.location,
      status: 'pending',
      estimatedPrice: data.estimatedPrice,
      commission: data.estimatedPrice > 150 ? 0.15 : 0.10,
      createdAt: new Date(),
    };

    setMissions(prev => [newMission, ...prev]);
    console.log('Mission created:', newMission.id);
    
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId: user?.id || '',
      type: 'mission_request',
      title: 'Nouvelle demande créée',
      message: `Demande "${data.title}" en attente d'un artisan`,
      missionId: newMission.id,
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [notification, ...prev]);

    if (user?.id) {
      sendNotification({
        userId: user.id,
        title: 'Nouvelle demande créée',
        message: `Demande "${data.title}" en attente d'un artisan`,
        type: 'mission_request',
        missionId: newMission.id,
      });
    }

    return newMission;
  };

  const acceptMission = (missionId: string, artisanId: string) => {
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, status: 'accepted', artisanId, acceptedAt: new Date(), eta: 15 }
        : m
    ));
    console.log('Mission accepted:', missionId, 'by', artisanId);
    
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: mission.clientId,
        type: 'mission_accepted',
        title: 'Mission acceptée !',
        message: 'Un artisan arrive bientôt',
        missionId,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);

      sendNotification({
        userId: mission.clientId,
        title: 'Mission acceptée !',
        message: 'Un artisan arrive bientôt',
        type: 'mission_accepted',
        missionId,
      });
    }
  };

  const startMission = (missionId: string) => {
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, status: 'in_progress', eta: 0 }
        : m
    ));
    console.log('Mission started:', missionId);
  };

  const completeMission = (missionId: string, finalPrice: number) => {
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, status: 'completed', finalPrice, completedAt: new Date() }
        : m
    ));
    console.log('Mission completed:', missionId, 'price:', finalPrice);
    
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: mission.clientId,
        type: 'mission_completed',
        title: 'Mission terminée',
        message: `Montant: ${finalPrice}€. Notez votre artisan !`,
        missionId,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);

      sendNotification({
        userId: mission.clientId,
        title: 'Mission terminée',
        message: `Montant: ${finalPrice}€. Notez votre artisan !`,
        type: 'mission_completed',
        missionId,
      });
    }
  };

  const cancelMission = (missionId: string) => {
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, status: 'cancelled' }
        : m
    ));
    console.log('Mission cancelled:', missionId);
  };

  const updateArtisanLocation = (missionId: string, location: Location) => {
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, artisanLocation: location }
        : m
    ));
  };

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

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const unreadNotificationsCount = notifications.filter(n => 
    n.userId === user?.id && !n.read
  ).length;

  return useMemo(() => ({
    missions,
    activeMission,
    notifications,
    unreadNotificationsCount,
    createMission,
    acceptMission,
    startMission,
    completeMission,
    cancelMission,
    updateArtisanLocation,
    getUserMissions,
    getPendingMissionsForArtisan,
    markNotificationAsRead,
  }), [
    missions,
    activeMission,
    notifications,
    user?.id,
    sendNotification,
  ]);
});
