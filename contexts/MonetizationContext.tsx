import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
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

  const adPrefsQuery = trpc.monetization.ads.getPreferences.useQuery({ userId }, { enabled: false });
  const subQuery = trpc.monetization.premium.getClientSubscription.useQuery({ userId }, { enabled: false });

  const updatePrefsMutation = trpc.monetization.ads.updatePreferences.useMutation();
  const subscribeMutation = trpc.monetization.premium.subscribeClient.useMutation();

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
      const res = await updatePrefsMutation.mutateAsync({ userId, ...prefs });
      return res;
    } catch (e) {
      setOptimisticPrefs(null);
      throw e;
    }
  }, [updatePrefsMutation, userId]);

  const subscribeClient = useCallback(async (plan: 'premium_monthly' | 'premium_annual', paymentMethodId: string) => {
    if (!userId) return { success: false } as const;
    return subscribeMutation.mutateAsync({ userId, plan, paymentMethodId });
  }, [subscribeMutation, userId]);

  return useMemo(() => ({
    preferences,
    subscription,
    loading: adPrefsQuery.isLoading || subQuery.isLoading,
    updating: (updatePrefsMutation as unknown as { isPending?: boolean }).isPending ?? false,
    subscribing: (subscribeMutation as unknown as { isPending?: boolean }).isPending ?? false,
    updatePreferences,
    subscribeClient,
  }), [preferences, subscription, adPrefsQuery.isLoading, subQuery.isLoading, (updatePrefsMutation as unknown as { isPending?: boolean }).isPending, (subscribeMutation as unknown as { isPending?: boolean }).isPending, updatePreferences, subscribeClient]);
});
