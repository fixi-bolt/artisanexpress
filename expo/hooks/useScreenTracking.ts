import { useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useAuth } from '@/contexts/AuthContext';

export function useScreenTracking(screenName: string, properties?: Record<string, string | number | boolean>) {
  const { trackScreenView } = useAnalytics();
  const { user } = useAuth();

  useEffect(() => {
    trackScreenView(screenName, {
      ...properties,
      ...(user?.id && { userId: user.id }),
      ...(user?.type && { userType: user.type }),
    });
  }, [screenName, trackScreenView, user?.id, user?.type, properties]);
}
