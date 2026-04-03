import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAutomation } from '@/contexts/AutomationContext';
import { ChevronRight, RefreshCcw, Save, Calendar, FileText } from 'lucide-react-native';

export default function AutomationScreen() {
  const insets = useSafeAreaInsets();
  const { settings, setSettings, save, isSaving, error } = useAutomation();

  const toggleAutoInvoice = useCallback(() => {
    setSettings({ ...settings, autoInvoice: !settings.autoInvoice });
  }, [settings, setSettings]);

  const cycleExport = useCallback(() => {
    const order: ('off' | 'weekly' | 'monthly')[] = ['off', 'weekly', 'monthly'];
    const next = order[(order.indexOf(settings.accountingExport) + 1) % order.length];
    setSettings({ ...settings, accountingExport: next });
  }, [settings, setSettings]);

  const changeReminder = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(14, settings.autoReminderDays + delta));
    setSettings({ ...settings, autoReminderDays: next });
  }, [settings, setSettings]);

  const onSave = useCallback(async () => {
    console.log('Saving automation settings', settings);
    await save(settings);
  }, [save, settings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="automation-screen">
      <Stack.Screen options={{ title: 'Automatisations' }} />

      <View style={styles.card} testID="auto-invoice-card">
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <FileText color="#111" size={20} />
            <Text style={styles.title}>Factures automatiques</Text>
          </View>
          <Switch value={settings.autoInvoice} onValueChange={toggleAutoInvoice} testID="toggle-auto-invoice" />
        </View>
        <Text style={styles.desc}>Génère et envoie automatiquement une facture à la fin de chaque mission.</Text>
      </View>

      <View style={styles.card} testID="reminder-card">
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Calendar color="#111" size={20} />
            <Text style={styles.title}>Relance avant échéance</Text>
          </View>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => changeReminder(-1)} style={styles.chip} testID="reminder-decrease">
              <Text style={styles.chipText}>-1j</Text>
            </TouchableOpacity>
            <Text style={styles.value}>{settings.autoReminderDays}j</Text>
            <TouchableOpacity onPress={() => changeReminder(1)} style={styles.chip} testID="reminder-increase">
              <Text style={styles.chipText}>+1j</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.desc}>Envoie une relance {settings.autoReminderDays} jours avant l’échéance de paiement.</Text>
      </View>

      <View style={styles.card} testID="accounting-card">
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <RefreshCcw color="#111" size={20} />
            <Text style={styles.title}>Export comptable</Text>
          </View>
          <TouchableOpacity style={styles.selector} onPress={cycleExport} testID="cycle-export">
            <Text style={styles.selectorText}>{settings.accountingExport === 'off' ? 'Désactivé' : settings.accountingExport === 'weekly' ? 'Hebdo' : 'Mensuel'}</Text>
            <ChevronRight color="#666" size={18} />
          </TouchableOpacity>
        </View>
        <Text style={styles.desc}>Planifie l’export CSV pour votre logiciel comptable.</Text>
      </View>

      {!!error && (
        <Text style={styles.error} testID="save-error">{error}</Text>
      )}

      <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={onSave} disabled={isSaving} testID="save-button">
        <Save color="#fff" size={18} />
        <Text style={styles.saveText}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' ? (
        <Text style={styles.hint}>Astuce: vos réglages sont sauvegardés dans le navigateur.</Text>
      ) : (
        <Text style={styles.hint}>Astuce: vos réglages sont sauvegardés sur l’appareil.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8F9FB' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  desc: { marginTop: 8, color: '#555' },
  chip: { backgroundColor: '#EEF1F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginHorizontal: 6 },
  chipText: { color: '#111', fontWeight: '600' },
  value: { fontWeight: '700', minWidth: 32, textAlign: 'center' },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
  selectorText: { fontWeight: '600', color: '#111' },
  error: { color: '#D00', marginVertical: 8 },
  saveBtn: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700' },
  hint: { textAlign: 'center', color: '#6B7280', marginTop: 10 },
});
