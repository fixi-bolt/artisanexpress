import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useLocalization, SupportedLocale, CurrencyCode, DistanceUnit } from '@/contexts/LocalizationContext';
import { Check, Globe, Map, BadgeDollarSign, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { locale, currency, distanceUnit, setLocale, setCurrency, setDistanceUnit, t } = useLocalization();
  const insets = useSafeAreaInsets();
  const [pendingLocale, setPendingLocale] = useState<SupportedLocale>(locale);
  const [pendingCurrency, setPendingCurrency] = useState<CurrencyCode>(currency);
  const [pendingUnit, setPendingUnit] = useState<DistanceUnit>(distanceUnit);

  const locales = useMemo(() => ([
    { key: 'fr' as SupportedLocale, label: t('language_fr') },
    { key: 'en' as SupportedLocale, label: t('language_en') },
    { key: 'es' as SupportedLocale, label: t('language_es') },
    { key: 'de' as SupportedLocale, label: t('language_de') },
  ]), [t]);

  const currencies: { key: CurrencyCode; label: string }[] = [
    { key: 'EUR', label: 'EUR' },
    { key: 'USD', label: 'USD' },
    { key: 'GBP', label: 'GBP' },
  ];

  const units: { key: DistanceUnit; label: string }[] = [
    { key: 'km', label: t('unit_km') },
    { key: 'mi', label: t('unit_mi') },
  ];

  const apply = () => {
    setLocale(pendingLocale);
    setCurrency(pendingCurrency);
    setDistanceUnit(pendingUnit);
  };

  return (
    <View style={styles.container} testID="settings-screen">
      <Stack.Screen 
        options={{ 
          title: t('settings_title'),
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
              testID="back-button"
            >
              <ArrowLeft size={24} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <Text style={styles.sectionTitle}>{t('settings_language')}</Text>
        <View style={styles.card}>
          {locales.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setPendingLocale(opt.key)}
              testID={`lang-${opt.key}`}
            >
              <View style={styles.rowLeft}>
                <Globe size={18} color={Colors.primary} />
                <Text style={styles.rowLabel}>{opt.label}</Text>
              </View>
              {pendingLocale === opt.key && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('settings_currency')}</Text>
        <View style={styles.card}>
          {currencies.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setPendingCurrency(opt.key)}
              testID={`currency-${opt.key}`}
            >
              <View style={styles.rowLeft}>
                <BadgeDollarSign size={18} color={Colors.primary} />
                <Text style={styles.rowLabel}>{opt.label}</Text>
              </View>
              {pendingCurrency === opt.key && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('settings_distance_unit')}</Text>
        <View style={styles.card}>
          {units.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setPendingUnit(opt.key)}
              testID={`unit-${opt.key}`}
            >
              <View style={styles.rowLeft}>
                <Map size={18} color={Colors.primary} />
                <Text style={styles.rowLabel}>{opt.label}</Text>
              </View>
              {pendingUnit === opt.key && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={apply} activeOpacity={0.8} testID="save-settings">
          <Text style={styles.saveText}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700' as const,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
