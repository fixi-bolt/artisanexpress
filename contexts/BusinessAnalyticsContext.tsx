import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

export const [BusinessAnalyticsContext, useBusinessAnalytics] = createContextHook(() => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const revenueQuery = trpc.business.getRevenueAnalytics.useQuery({ period });
  const userMetricsQuery = trpc.business.getUserMetrics.useQuery({ period });
  const conversionFunnelQuery = trpc.business.getConversionFunnel.useQuery({ period });

  const changePeriod = useCallback((newPeriod: AnalyticsPeriod) => {
    console.log('[BusinessAnalytics] Changing period to:', newPeriod);
    setPeriod(newPeriod);
  }, []);

  const refresh = useCallback(() => {
    console.log('[BusinessAnalytics] Refreshing all data');
    revenueQuery.refetch();
    userMetricsQuery.refetch();
    conversionFunnelQuery.refetch();
  }, [revenueQuery, userMetricsQuery, conversionFunnelQuery]);

  return useMemo(() => ({
    period,
    changePeriod,
    refresh,
    revenueData: revenueQuery.data,
    isLoadingRevenue: revenueQuery.isLoading,
    revenueError: revenueQuery.error,
    userMetrics: userMetricsQuery.data,
    isLoadingUserMetrics: userMetricsQuery.isLoading,
    userMetricsError: userMetricsQuery.error,
    conversionFunnel: conversionFunnelQuery.data,
    isLoadingConversion: conversionFunnelQuery.isLoading,
    conversionError: conversionFunnelQuery.error,
  }), [
    period,
    changePeriod,
    refresh,
    revenueQuery.data,
    revenueQuery.isLoading,
    revenueQuery.error,
    userMetricsQuery.data,
    userMetricsQuery.isLoading,
    userMetricsQuery.error,
    conversionFunnelQuery.data,
    conversionFunnelQuery.isLoading,
    conversionFunnelQuery.error,
  ]);
});
