import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
}

export interface RevenueData {
  summary: {
    totalRevenue: number;
    totalCommissions: number;
    revenueGrowth: number;
    totalTransactions: number;
    averageTransactionValue: number;
  };
  revenueData: RevenueDataPoint[];
  topCategories: CategoryRevenue[];
}

export interface UserDataPoint {
  date: string;
  newUsers: number;
}

export interface UserSegment {
  segment: string;
  count: number;
}

export interface UserMetrics {
  summary: {
    totalUsers: number;
    userGrowth: number;
    retentionRate: number;
    averageSessionDuration: number;
    churnRate: number;
  };
  userData: UserDataPoint[];
  userSegments: UserSegment[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface Dropoff {
  from: string;
  to: string;
  dropoffRate: number;
  dropoff: number;
}

export interface ConversionFunnel {
  overallConversionRate: number;
  funnel: FunnelStage[];
  dropoffAnalysis: Dropoff[];
}

export const [BusinessAnalyticsContext, useBusinessAnalytics] = createContextHook(() => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const revenueQuery = useMemo(() => ({ 
    data: null as RevenueData | null, 
    isLoading: false, 
    error: null, 
    refetch: () => Promise.resolve() 
  }), []);
  const userMetricsQuery = useMemo(() => ({ 
    data: null as UserMetrics | null, 
    isLoading: false, 
    error: null, 
    refetch: () => Promise.resolve() 
  }), []);
  const conversionFunnelQuery = useMemo(() => ({ 
    data: null as ConversionFunnel | null, 
    isLoading: false, 
    error: null, 
    refetch: () => Promise.resolve() 
  }), []);

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
