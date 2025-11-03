import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import type { Notification as AppNotification } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const registerTokenMutation = trpc.notifications.registerToken.useMutation({
    onError: (error) => {
      console.log('[Notifications] Backend unavailable for token registration:', error.message);
    },
  });

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[Notifications] Push notifications not supported on web');
      return '';
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return '';
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('[Notifications] Expo push token:', token);

      return token;
    } catch (error) {
      console.log('[Notifications] Error getting push token:', error);
      return '';
    }
  }, []);

  useEffect(() => {
    // Defer push token registration to not block initial render
    const timeoutId = setTimeout(() => {
      registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            setExpoPushToken(token);
          }
        })
        .catch((error) => {
          console.log('[Notifications] Failed to register for push notifications:', error);
        });
    }, 500);

    if (Platform.OS !== 'web') {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notifications] Notification received:', notification);
        
        const appNotification: AppNotification = {
          id: notification.request.identifier,
          userId: '',
          type: notification.request.content.data?.type as AppNotification['type'] || 'mission_request',
          title: notification.request.content.title || '',
          message: notification.request.content.body || '',
          missionId: notification.request.content.data?.missionId as string,
          read: false,
          createdAt: new Date(),
        };

        setNotifications((prev) => [appNotification, ...prev]);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Notifications] Notification tapped:', response);
      });

      return () => {
        clearTimeout(timeoutId);
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    } else {
      return () => clearTimeout(timeoutId);
    }
  }, [registerForPushNotificationsAsync]);

  const registerPushToken = useCallback(
    async (userId: string) => {
      if (expoPushToken) {
        try {
          await registerTokenMutation.mutateAsync({
            userId,
            token: expoPushToken,
            platform: Platform.OS as 'ios' | 'android' | 'web',
          });
          console.log('[Notifications] Token registered for user:', userId);
        } catch {
          console.log('[Notifications] Failed to register token - backend unavailable');
        }
      }
    },
    [expoPushToken, registerTokenMutation]
  );

  const sendNotification = useCallback(
    async (params: {
      userId: string;
      title: string;
      message: string;
      type: AppNotification['type'];
      missionId?: string;
      data?: Record<string, string>;
    }) => {
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: params.title,
            body: params.message,
            data: {
              type: params.type,
              missionId: params.missionId,
              ...params.data,
            },
          },
          trigger: null,
        });
      }

      console.log('[Notifications] Notification sent:', params);
    },
    []
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return useMemo(
    () => ({
      notifications,
      expoPushToken,
      registerPushToken,
      sendNotification,
      markAsRead,
      clearAll,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
    [
      notifications,
      expoPushToken,
      registerPushToken,
      sendNotification,
      markAsRead,
      clearAll,
    ]
  );
});
