import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { CheckCircle2, ChevronDown, ChevronUp, Wrench } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const TOP10 = [
  { value: 'plumber', label: 'Plombier' },
  { value: 'electrician', label: 'Électricien' },
  { value: 'painter', label: 'Peintre' },
  { value: 'carpenter', label: 'Menuisier' },
  { value: 'mason', label: 'Maçon' },
  { value: 'hvac', label: 'Chauffagiste' },
  { value: 'roofer', label: 'Couvreur' },
  { value: 'tiler', label: 'Carreleur' },
  { value: 'locksmith', label: 'Serrurier' },
  { value: 'gardener', label: 'Jardinier' },
] as const;

const ALL_CATEGORIES = [
  { value: 'glazier', label: 'Vitrier' },
  { value: 'cleaner', label: 'Agent d’entretien' },
  { value: 'mechanic', label: 'Mécanicien' },
  { value: 'appliance_repair', label: 'Réparateur électroménager' },
  { value: 'interior_designer', label: 'Décorateur intérieur' },
  { value: 'handyman', label: 'Homme toutes mains' },
  { value: 'auto_body', label: 'Carrossier' },
  { value: 'chimney_sweep', label: 'Ramoneur' },
  { value: 'framer', label: 'Charpentier' },
  { value: 'housekeeper', label: 'Aide ménagère' },
  { value: 'it_tech', label: 'Technicien IT' },
  { value: 'mover', label: 'Déménageur' },
  { value: 'welder', label: 'Soudeur' },
  { value: 'pool_tech', label: 'Pisciniste' },
  { value: 'refrigeration', label: 'Frigoriste' },
  { value: 'home_automation', label: 'Domoticien' },
];

export default function SpecialtySelectionScreen() {
  const router = useRouter();
  const { user, isArtisan } = useAuth();
  const [selected, setSelected] = useState<string>('');
  const [custom, setCustom] = useState<string>('');
  const [showOthers, setShowOthers] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const canContinue = useMemo(() => Boolean((selected && selected.length > 0) || (custom && custom.trim().length > 1)), [selected, custom]);

  const onSave = useCallback(async () => {
    if (isSaving) return;
    
    setError('');
    if (!isArtisan || !user) {
      setError("Action non autorisée");
      return;
    }
    if (!canContinue) {
      setError('Veuillez sélectionner ou saisir une spécialité.');
      return;
    }
    try {
      setIsSaving(true);
      const chosen = custom.trim().length > 1 ? custom.trim() : selected;
      console.log('Saving specialty', chosen);
      const { error: dbError } = await supabase
        .from('artisans')
        .update({ category: chosen })
        .eq('id', user.id);
      if (dbError) throw dbError;
      
      router.replace('/(artisan)/dashboard' as any);
    } catch (e: any) {
      console.error('Save specialty error', e);
      setError(e?.message ?? 'Erreur lors de la sauvegarde');
      setIsSaving(false);
    }
  }, [isArtisan, user, canContinue, custom, selected, router, isSaving]);

  return (
    <View style={styles.container} testID="specialtyScreen">
      <Stack.Screen options={{ headerShown: true, title: 'Votre spécialité' }} />

      <Text style={styles.title} testID="title">Choisissez votre spécialité</Text>
      <Text style={styles.subtitle}>Utilisée pour mieux vous faire découvrir par les clients</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid} testID="topGrid">
          {TOP10.map(item => {
            const active = selected === item.value && custom.trim().length === 0;
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => { setSelected(item.value); setCustom(''); }}
                activeOpacity={0.8}
                testID={`chip-${item.value}`}
              >
                {active ? <CheckCircle2 size={16} color={Colors.surface} /> : <Wrench size={16} color={Colors.textSecondary} />}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.dropdownHeader} onPress={() => setShowOthers(v => !v)} testID="toggleOthers">
          <Text style={styles.dropdownTitle}>Autres spécialités…</Text>
          {showOthers ? <ChevronUp size={18} color={Colors.text} /> : <ChevronDown size={18} color={Colors.text} />}
        </TouchableOpacity>

        {showOthers && (
          <View style={styles.list} testID="othersList">
            {ALL_CATEGORIES.map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.listItem}
                onPress={() => { setSelected(item.value); setCustom(''); }}
                testID={`other-${item.value}`}
              >
                <Text style={styles.listLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputCard} testID="customBox">
          <Text style={styles.inputLabel}>Spécialité personnalisée</Text>
          <TextInput
            placeholder="Ex. Installateur panneaux solaires"
            style={styles.input}
            value={custom}
            onChangeText={(t) => { setCustom(t); if (t.length > 0) setSelected(''); }}
            autoCapitalize="sentences"
            testID="inputCustom"
          />
          <Text style={styles.hint}>Toujours visible. Si votre métier n’est pas listé, saisissez-le ici.</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox} testID="errorBox">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.cta, (!canContinue || isSaving) && styles.ctaDisabled]}
          onPress={onSave}
          disabled={!canContinue || isSaving}
          testID="saveButton"
        >
          <Text style={styles.ctaText}>{isSaving ? 'Enregistrement…' : 'Continuer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  scroll: { paddingBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F1F5F9' },
  chipActive: { backgroundColor: Colors.secondary },
  chipText: { color: Colors.text, fontWeight: '600' as const },
  chipTextActive: { color: Colors.surface },
  dropdownHeader: { marginTop: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  dropdownTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  list: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  listItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  listLabel: { color: Colors.text },
  inputCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  inputLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', color: Colors.text },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 10, borderRadius: 10, marginTop: 12 },
  errorText: { color: Colors.error },
  cta: { backgroundColor: Colors.secondary, marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontWeight: '700' as const, fontSize: 16 },
});
