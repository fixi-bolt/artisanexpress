import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type AutomationSettings = {
  autoInvoice: boolean;
  autoReminderDays: number; // send reminder X days before due
  accountingExport: 'off' | 'weekly' | 'monthly';
};

const DEFAULT_SETTINGS: AutomationSettings = {
  autoInvoice: true,
  autoReminderDays: 3,
  accountingExport: 'monthly',
};

export const [AutomationProvider, useAutomation] = createContextHook(() => {
  const [settings, setSettings] = useState<AutomationSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded) return;
    
    const load = async () => {
      const key = 'automation:settings';
      try {
        if (Platform.OS === 'web') {
          let raw: string | null = null;
          
          try {
            raw = window.localStorage.getItem(key);
          } catch {
            setSettings(DEFAULT_SETTINGS);
            return;
          }

          if (!raw || raw === 'null' || raw === 'undefined' || raw.trim() === '') {
            try {
              window.localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            } catch {
              
            }
            setSettings(DEFAULT_SETTINGS);
            return;
          }

          try {
            const trimmed = raw.trim();
            if (!trimmed.startsWith('{')) {
              throw new Error('Invalid format');
            }

            const parsed = JSON.parse(trimmed);
            if (
              parsed &&
              typeof parsed === 'object' &&
              typeof parsed.autoInvoice === 'boolean' &&
              typeof parsed.autoReminderDays === 'number' &&
              ['off', 'weekly', 'monthly'].includes(parsed.accountingExport)
            ) {
              setSettings(parsed as AutomationSettings);
            } else {
              throw new Error('Invalid structure');
            }
          } catch {
            try {
              window.localStorage.removeItem(key);
              window.localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            } catch {
              
            }
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          let raw: string | null = null;
          
          try {
            raw = await AsyncStorage.getItem(key);
          } catch {
            setSettings(DEFAULT_SETTINGS);
            return;
          }

          if (!raw || raw === 'null' || raw === 'undefined' || raw.trim() === '') {
            try {
              await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            } catch {
              
            }
            setSettings(DEFAULT_SETTINGS);
            return;
          }

          try {
            const trimmed = raw.trim();
            if (!trimmed.startsWith('{')) {
              throw new Error('Invalid format');
            }

            const parsed = JSON.parse(trimmed);
            if (
              parsed &&
              typeof parsed === 'object' &&
              typeof parsed.autoInvoice === 'boolean' &&
              typeof parsed.autoReminderDays === 'number' &&
              ['off', 'weekly', 'monthly'].includes(parsed.accountingExport)
            ) {
              setSettings(parsed as AutomationSettings);
            } else {
              throw new Error('Invalid structure');
            }
          } catch {
            try {
              await AsyncStorage.removeItem(key);
              await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            } catch {
              
            }
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoaded(true);
      }
    };
    
    // Defer loading to not block initial render
    const timeoutId = setTimeout(() => {
      void load();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isLoaded]);

  const save = useCallback(async (next: AutomationSettings) => {
    setIsSaving(true);
    setError(null);
    try {
      const key = 'automation:settings';
      if (Platform.OS === 'web') {
        window.localStorage.setItem(key, JSON.stringify(next));
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      }
      setSettings(next);
      return { success: true } as const;
    } catch (e) {
      console.error('Failed to save automation settings', e);
      setError('Impossible d\'enregistrer les réglages.');
      return { success: false } as const;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return useMemo(() => ({ settings, isSaving, error, save, setSettings }), [settings, isSaving, error, save]);
});
