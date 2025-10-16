import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type BrandingPreset = 'default' | 'midnight' | 'sunrise';

export interface BrandingConfig {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline?: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'ArtisanNow',
  logoUrl: 'https://images.unsplash.com/photo-1556514767-5cac0f0b5b1d?q=80&w=600&auto=format&fit=crop',
  primaryColor: '#1E3A8A',
  secondaryColor: '#F97316',
  accentColor: '#10B981',
  tagline: 'Trouver un artisan fiable en quelques minutes',
};

export const [BrandingProvider, useBranding] = createContextHook(() => {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const storageKey = 'branding_config_v1';

  const loadBranding = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed: BrandingConfig = JSON.parse(stored);
        if (parsed && parsed.appName && parsed.primaryColor && parsed.secondaryColor && parsed.accentColor) {
          setBranding(parsed);
        }
      }
    } catch (e) {
      console.error('[Branding] Failed to load branding', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBranding = useCallback(async (next: BrandingConfig) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setBranding(next);
    } catch (e) {
      console.error('[Branding] Failed to save branding', e);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<BrandingConfig>) => {
      setBranding(prev => {
        const next: BrandingConfig = { ...prev, ...patch };
        void AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch((e) => console.error('[Branding] persist error', e));
        return next;
      });
    },
    []
  );

  const applyPreset = useCallback((preset: BrandingPreset) => {
    switch (preset) {
      case 'midnight':
        saveBranding({
          ...branding,
          primaryColor: '#0F172A',
          secondaryColor: '#22D3EE',
          accentColor: '#A78BFA',
        });
        break;
      case 'sunrise':
        saveBranding({
          ...branding,
          primaryColor: '#FB7185',
          secondaryColor: '#F59E0B',
          accentColor: '#34D399',
        });
        break;
      default:
        saveBranding(DEFAULT_BRANDING);
        break;
    }
  }, [branding, saveBranding]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  return useMemo(() => ({ branding, isLoading, update, saveBranding, applyPreset, DEFAULT_BRANDING }), [branding, isLoading, update, saveBranding, applyPreset]);
});
