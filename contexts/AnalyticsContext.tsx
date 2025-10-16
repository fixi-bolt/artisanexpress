import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type AnalyticsEvent =
  | 'app_opened'
  | 'user_logged_in'
  | 'user_registered'
  | 'mission_requested'
  | 'mission_accepted'
  | 'mission_started'
  | 'mission_completed'
  | 'mission_cancelled'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'chat_message_sent'
  | 'rating_submitted'
  | 'profile_viewed'
  | 'search_performed'
  | 'notification_received'
  | 'notification_opened'
  | 'help_requested'
  | 'screen_viewed';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
  platform: string;
  userId?: string;
  userType?: 'client' | 'artisan' | 'admin';
}

interface AnalyticsStats {
  totalEvents: number;
  sessionsCount: number;
  averageSessionDuration: number;
  lastSessionDate: string | null;
}

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [sessionStart] = useState(() => Date.now());
  const [stats, setStats] = useState<AnalyticsStats>({
    totalEvents: 0,
    sessionsCount: 0,
    averageSessionDuration: 0,
    lastSessionDate: null,
  });

  const loadStats = useCallback(async () => {
    try {
      const storedStats = await AsyncStorage.getItem('analytics_stats');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (error) {
      console.error('Failed to load analytics stats:', error);
    }
  }, []);

  const saveStats = useCallback(async (newStats: AnalyticsStats) => {
    try {
      await AsyncStorage.setItem('analytics_stats', JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Failed to save analytics stats:', error);
    }
  }, []);

  const updateSessionStats = useCallback(async (sessionDuration: number) => {
    const newSessionsCount = stats.sessionsCount + 1;
    const newAverageDuration =
      (stats.averageSessionDuration * stats.sessionsCount + sessionDuration) / newSessionsCount;

    await saveStats({
      ...stats,
      sessionsCount: newSessionsCount,
      averageSessionDuration: newAverageDuration,
      lastSessionDate: new Date().toISOString(),
    });
  }, [stats, saveStats]);

  const trackEvent = useCallback(async (
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>,
    userId?: string,
    userType?: 'client' | 'artisan' | 'admin'
  ) => {
    const eventData: AnalyticsEventData = {
      event,
      properties: {
        ...properties,
        sessionId,
      },
      timestamp: Date.now(),
      platform: Platform.OS,
      userId,
      userType,
    };

    console.log('📊 Analytics Event:', eventData);

    try {
      const eventsKey = 'analytics_events';
      const storedEvents = await AsyncStorage.getItem(eventsKey);
      const events: AnalyticsEventData[] = storedEvents ? JSON.parse(storedEvents) : [];
      
      events.push(eventData);
      
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await AsyncStorage.setItem(eventsKey, JSON.stringify(events));
      
      await saveStats({
        ...stats,
        totalEvents: stats.totalEvents + 1,
      });

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [sessionId, stats, saveStats]);

  const trackScreenView = useCallback((screenName: string, properties?: Record<string, string | number | boolean>) => {
    trackEvent('screen_viewed', {
      screen_name: screenName,
      ...properties,
    });
  }, [trackEvent]);

  const getEvents = useCallback(async (limit?: number): Promise<AnalyticsEventData[]> => {
    try {
      const storedEvents = await AsyncStorage.getItem('analytics_events');
      if (!storedEvents) return [];
      
      const events: AnalyticsEventData[] = JSON.parse(storedEvents);
      return limit ? events.slice(-limit) : events;
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }, []);

  const clearAnalytics = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('analytics_events');
      await AsyncStorage.removeItem('analytics_stats');
      setStats({
        totalEvents: 0,
        sessionsCount: 0,
        averageSessionDuration: 0,
        lastSessionDate: null,
      });
    } catch (error) {
      console.error('Failed to clear analytics:', error);
    }
  }, []);

  const getConversionRate = useCallback(async (fromEvent: AnalyticsEvent, toEvent: AnalyticsEvent): Promise<number> => {
    try {
      const events = await getEvents();
      const fromCount = events.filter(e => e.event === fromEvent).length;
      const toCount = events.filter(e => e.event === toEvent).length;
      
      if (fromCount === 0) return 0;
      return (toCount / fromCount) * 100;
    } catch (error) {
      console.error('Failed to calculate conversion rate:', error);
      return 0;
    }
  }, [getEvents]);

  useEffect(() => {
    loadStats();
    trackEvent('app_opened', { sessionId });
    
    return () => {
      const sessionDuration = (Date.now() - sessionStart) / 1000;
      updateSessionStats(sessionDuration);
    };
  }, [loadStats, trackEvent, sessionId, sessionStart, updateSessionStats]);

  return useMemo(() => ({
    trackEvent,
    trackScreenView,
    getEvents,
    clearAnalytics,
    getConversionRate,
    stats,
    sessionId,
  }), [trackEvent, trackScreenView, getEvents, clearAnalytics, getConversionRate, stats, sessionId]);
});
