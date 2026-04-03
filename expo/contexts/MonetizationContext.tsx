import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type AdPreferences = {
  personalizedAds: boolean;
  allowPromotions: boolean;
  categories: string[];
};

export type ClientSubscription = {
  status: 'inactive' | 'active' | 'past_due' | 'canceled';
  plan: null | 'premium_monthly' | 'premium_annual';
  renewsAt: Date | null;
};

export const [MonetizationProvider, useMonetization] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const adPrefsQuery = { data: null, isLoading: false, error: null };
  const subQuery = { data: null, isLoading: false, error: null };

  const updatePrefsMutation = useMemo(() => ({
    mutateAsync: async () => ({ success: true } as const),
    isPending: false,
  }), []);
  
  const subscribeMutation = useMemo(() => ({
    mutateAsync: async () => ({ success: true } as const),
    isPending: false,
  }), []);

  const [optimisticPrefs, setOptimisticPrefs] = useState<AdPreferences | null>(null);

  const preferences: AdPreferences | null = useMemo(() => {
    if (optimisticPrefs) return optimisticPrefs;
    if (adPrefsQuery.data) {
      const d = adPrefsQuery.data as { personalizedAds: boolean; allowPromotions: boolean; categories: readonly string[] };
      return { ...d, categories: [...d.categories] } satisfies AdPreferences;
    }
    return null;
  }, [adPrefsQuery.data, optimisticPrefs]);

  const subscription: ClientSubscription | null = useMemo(() => {
    return subQuery.data ?? null;
  }, [subQuery.data]);

  const updatePreferences = useCallback(async (prefs: AdPreferences) => {
    if (!userId) return { success: false } as const;
    setOptimisticPrefs(prefs);
    try {
      const res = await updatePrefsMutation.mutateAsync();
      return res;
    } catch (e) {
      setOptimisticPrefs(null);
      throw e;
    }
  }, [updatePrefsMutation, userId]);

  const subscribeClient = useCallback(async (_plan: 'premium_monthly' | 'premium_annual', _paymentMethodId: string) => {
    if (!userId) return { success: false } as const;
    return subscribeMutation.mutateAsync();
  }, [subscribeMutation, userId]);

  return useMemo(() => ({
    preferences,
    subscription,
    loading: adPrefsQuery.isLoading || subQuery.isLoading,
    updating: updatePrefsMutation.isPending,
    subscribing: subscribeMutation.isPending,
    updatePreferences,
    subscribeClient,
  }), [preferences, subscription, adPrefsQuery.isLoading, subQuery.isLoading, updatePrefsMutation.isPending, subscribeMutation.isPending, updatePreferences, subscribeClient]);
});
