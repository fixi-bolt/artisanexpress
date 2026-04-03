import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export type SupportedLocale = 'fr' | 'en' | 'es' | 'de';
export type DistanceUnit = 'km' | 'mi';
export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

type Dictionary = Record<string, string>;

const fr: Dictionary = {
  common_ok: 'OK',
  nav_map: 'Carte',
  nav_missions: 'Missions',
  nav_profile: 'Profil',
  profile_title: 'Profil',
  profile_missions: 'Missions',
  profile_avg_rating: 'Note moyenne',
  logout: 'Déconnexion',
  logout_confirm_title: 'Déconnexion',
  logout_confirm_message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
  cancel: 'Annuler',
  settings: 'Paramètres',
  settings_title: 'Langue & Région',
  settings_language: 'Langue',
  settings_region: 'Région',
  settings_currency: 'Devise',
  settings_distance_unit: 'Unité de distance',
  unit_km: 'Kilomètres',
  unit_mi: 'Miles',
  language_fr: 'Français',
  language_en: 'Anglais',
  language_es: 'Espagnol',
  language_de: 'Allemand',
  save: 'Enregistrer',
};

const en: Dictionary = {
  common_ok: 'OK',
  nav_map: 'Map',
  nav_missions: 'Jobs',
  nav_profile: 'Profile',
  profile_title: 'Profile',
  profile_missions: 'Jobs',
  profile_avg_rating: 'Avg rating',
  logout: 'Log out',
  logout_confirm_title: 'Log out',
  logout_confirm_message: 'Are you sure you want to log out?',
  cancel: 'Cancel',
  settings: 'Settings',
  settings_title: 'Language & Region',
  settings_language: 'Language',
  settings_region: 'Region',
  settings_currency: 'Currency',
  settings_distance_unit: 'Distance unit',
  unit_km: 'Kilometers',
  unit_mi: 'Miles',
  language_fr: 'French',
  language_en: 'English',
  language_es: 'Spanish',
  language_de: 'German',
  save: 'Save',
};

const es: Dictionary = {
  common_ok: 'OK',
  nav_map: 'Mapa',
  nav_missions: 'Trabajos',
  nav_profile: 'Perfil',
  profile_title: 'Perfil',
  profile_missions: 'Trabajos',
  profile_avg_rating: 'Nota media',
  logout: 'Cerrar sesión',
  logout_confirm_title: 'Cerrar sesión',
  logout_confirm_message: '¿Seguro que quieres cerrar sesión?',
  cancel: 'Cancelar',
  settings: 'Ajustes',
  settings_title: 'Idioma y región',
  settings_language: 'Idioma',
  settings_region: 'Región',
  settings_currency: 'Moneda',
  settings_distance_unit: 'Unidad de distancia',
  unit_km: 'Kilómetros',
  unit_mi: 'Millas',
  language_fr: 'Francés',
  language_en: 'Inglés',
  language_es: 'Español',
  language_de: 'Alemán',
  save: 'Guardar',
};

const de: Dictionary = {
  common_ok: 'OK',
  nav_map: 'Karte',
  nav_missions: 'Aufträge',
  nav_profile: 'Profil',
  profile_title: 'Profil',
  profile_missions: 'Aufträge',
  profile_avg_rating: 'Durchschn. Bewertung',
  logout: 'Abmelden',
  logout_confirm_title: 'Abmelden',
  logout_confirm_message: 'Möchten Sie sich wirklich abmelden?',
  cancel: 'Abbrechen',
  settings: 'Einstellungen',
  settings_title: 'Sprache & Region',
  settings_language: 'Sprache',
  settings_region: 'Region',
  settings_currency: 'Währung',
  settings_distance_unit: 'Entfernungseinheit',
  unit_km: 'Kilometer',
  unit_mi: 'Meilen',
  language_fr: 'Französisch',
  language_en: 'Englisch',
  language_es: 'Spanisch',
  language_de: 'Deutsch',
  save: 'Speichern',
};

const DICTS: Record<SupportedLocale, Dictionary> = { fr, en, es, de };

export interface LocalizationState {
  locale: SupportedLocale;
  currency: CurrencyCode;
  distanceUnit: DistanceUnit;
  region: string;
  t: (key: string) => string;
  formatCurrency: (amount: number, currency?: CurrencyCode) => string;
  formatDate: (date: Date | string | number, opts?: Intl.DateTimeFormatOptions) => string;
  setLocale: (locale: SupportedLocale) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setRegion: (region: string) => void;
}

const STORAGE_KEY = 'localization_settings_v1';

export const [LocalizationProvider, useLocalization] = createContextHook<LocalizationState>(() => {
  const [locale, setLocaleState] = useState<SupportedLocale>('fr');
  const [currency, setCurrencyState] = useState<CurrencyCode>('EUR');
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>('km');
  const [region, setRegionState] = useState<string>('FR');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded) return;
    
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { locale: SupportedLocale; currency: CurrencyCode; distanceUnit: DistanceUnit; region: string };
          setLocaleState(parsed.locale);
          setCurrencyState(parsed.currency);
          setDistanceUnitState(parsed.distanceUnit);
          setRegionState(parsed.region);
          return;
        }
      } catch (e) {
        console.log('Localization load error', e);
      }
      const navLang = Platform.OS === 'web' ? (navigator.language || 'fr').slice(0, 2) : 'fr';
      const inferred = (['fr', 'en', 'es', 'de'] as SupportedLocale[]).includes(navLang as SupportedLocale) ? (navLang as SupportedLocale) : 'fr';
      setLocaleState(inferred);
      setCurrencyState(inferred === 'fr' || inferred === 'de' ? 'EUR' : inferred === 'en' ? 'USD' : 'EUR');
      setDistanceUnitState(inferred === 'en' ? 'mi' : 'km');
      setRegionState(inferred === 'de' ? 'DE' : inferred === 'es' ? 'ES' : inferred === 'en' ? 'US' : 'FR');
      setIsLoaded(true);
    };
    
    // Defer loading to not block initial render
    const timeoutId = setTimeout(() => {
      load();
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [isLoaded]);

  const persist = useCallback(async (next: { locale?: SupportedLocale; currency?: CurrencyCode; distanceUnit?: DistanceUnit; region?: string }) => {
    try {
      const data = {
        locale: next.locale ?? locale,
        currency: next.currency ?? currency,
        distanceUnit: next.distanceUnit ?? distanceUnit,
        region: next.region ?? region,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Localization persist error', e);
    }
  }, [locale, currency, distanceUnit, region]);

  const setLocale = useCallback((l: SupportedLocale) => {
    setLocaleState(l);
    persist({ locale: l });
  }, [persist]);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    persist({ currency: c });
  }, [persist]);

  const setDistanceUnit = useCallback((u: DistanceUnit) => {
    setDistanceUnitState(u);
    persist({ distanceUnit: u });
  }, [persist]);

  const setRegion = useCallback((r: string) => {
    setRegionState(r);
    persist({ region: r });
  }, [persist]);

  const dict = useMemo(() => DICTS[locale], [locale]);

  const t = useCallback((key: string) => {
    const value = dict[key];
    if (!value) {
      console.log('Missing translation', key);
    }
    return value ?? key;
  }, [dict]);

  const formatCurrency = useCallback((amount: number, cur?: CurrencyCode) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: cur ?? currency }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${cur ?? currency}`;
    }
  }, [locale, currency]);

  const formatDate = useCallback((date: Date | string | number, opts?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    try {
      return new Intl.DateTimeFormat(locale, opts ?? { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch {
      return d.toISOString();
    }
  }, [locale]);

  return {
    locale,
    currency,
    distanceUnit,
    region,
    t,
    formatCurrency,
    formatDate,
    setLocale,
    setCurrency,
    setDistanceUnit,
    setRegion,
  };
});
