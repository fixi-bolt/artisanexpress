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

  useEffect(() => {
    const load = async () => {
      try {
        const key = 'automation:settings';
        if (Platform.OS === 'web') {
          try {
            const raw = window.localStorage.getItem(key);
            if (raw && raw.trim() && raw !== '{}' && raw !== 'null' && raw !== 'undefined') {
              const parsed = JSON.parse(raw) as AutomationSettings;
              if (parsed && typeof parsed === 'object' && 'autoInvoice' in parsed) {
                setSettings(parsed);
                return;
              }
            }
            window.localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            setSettings(DEFAULT_SETTINGS);
          } catch (parseError) {
            console.error('Invalid JSON in storage, resetting to defaults:', parseError);
            window.localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          try {
            const raw = await AsyncStorage.getItem(key);
            if (raw && raw.trim() && raw !== '{}' && raw !== 'null' && raw !== 'undefined') {
              const parsed = JSON.parse(raw) as AutomationSettings;
              if (parsed && typeof parsed === 'object' && 'autoInvoice' in parsed) {
                setSettings(parsed);
                return;
              }
            }
            await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            setSettings(DEFAULT_SETTINGS);
          } catch (parseError) {
            console.error('Invalid JSON in storage, resetting to defaults:', parseError);
            await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (e) {
        console.error('Failed to load automation settings', e);
        setSettings(DEFAULT_SETTINGS);
      }
    };
    load();
  }, []);

  const save = useCallback(async (next: AutomationSettings) => {
    setIsSaving(true);
    setError(null);
    try {
      const key = 'automation:settings';
      if (Platform.OS === 'web') {
        window.localStorage.setItem(key, JSON.stringify(next));
      } else {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
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
