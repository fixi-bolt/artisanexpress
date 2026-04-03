import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { BrandingProvider, useBranding } from '@/contexts/BrandingContext';
import colors from '@/constants/colors';
import { Check, Palette, Save, Wand2 } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function BrandingContent() {
  const { branding, update, saveBranding, applyPreset, DEFAULT_BRANDING } = useBranding();
  const [local, setLocal] = useState(branding);
  const [saving, setSaving] = useState<boolean>(false);

  const isDirty = useMemo(() => JSON.stringify(local) !== JSON.stringify(branding), [local, branding]);

  const handleSave = async () => {
    try {
      console.log('[Branding] Saving', local);
      setSaving(true);
      await saveBranding(local);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const apply = (preset: 'default' | 'midnight' | 'sunrise') => {
    applyPreset(preset);
    setLocal(preset === 'default' ? DEFAULT_BRANDING : { ...branding });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: true, title: 'Branding' }} />

      <View style={styles.preview} testID="branding-preview">
        <View style={[styles.logoWrap, { borderColor: local.primaryColor }]}> 
          <Image source={{ uri: local.logoUrl }} style={styles.logo} resizeMode="cover" />
        </View>
        <Text style={[styles.appName, { color: local.primaryColor }]}>{local.appName}</Text>
        <Text style={[styles.tagline, { color: local.secondaryColor }]}>{local.tagline ?? ''}</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorDot, { backgroundColor: local.primaryColor }]} />
          <View style={[styles.colorDot, { backgroundColor: local.secondaryColor }]} />
          <View style={[styles.colorDot, { backgroundColor: local.accentColor }]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identité</Text>
        <TextInput
          testID="input-app-name"
          style={styles.input}
          placeholder="Nom de l'app"
          value={local.appName}
          onChangeText={(t) => setLocal({ ...local, appName: t })}
        />
        <TextInput
          testID="input-tagline"
          style={styles.input}
          placeholder="Tagline"
          value={local.tagline ?? ''}
          onChangeText={(t) => setLocal({ ...local, tagline: t })}
        />
        <TextInput
          testID="input-logo-url"
          style={styles.input}
          placeholder="Logo URL (https://)"
          autoCapitalize="none"
          value={local.logoUrl}
          onChangeText={(t) => setLocal({ ...local, logoUrl: t })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Couleurs</Text>
        <View style={styles.colorInputs}>
          <TextInput
            testID="input-primary-color"
            style={styles.input}
            placeholder="#1E3A8A"
            autoCapitalize="none"
            value={local.primaryColor}
            onChangeText={(t) => setLocal({ ...local, primaryColor: t })}
          />
          <TextInput
            testID="input-secondary-color"
            style={styles.input}
            placeholder="#F97316"
            autoCapitalize="none"
            value={local.secondaryColor}
            onChangeText={(t) => setLocal({ ...local, secondaryColor: t })}
          />
          <TextInput
            testID="input-accent-color"
            style={styles.input}
            placeholder="#10B981"
            autoCapitalize="none"
            value={local.accentColor}
            onChangeText={(t) => setLocal({ ...local, accentColor: t })}
          />
        </View>
        <View style={styles.presetRow}>
          <TouchableOpacity style={styles.presetBtn} onPress={() => apply('default')}>
            <Palette size={16} color={colors.text} />
            <Text style={styles.presetText}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetBtn} onPress={() => apply('midnight')}>
            <Wand2 size={16} color={colors.text} />
            <Text style={styles.presetText}>Midnight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetBtn} onPress={() => apply('sunrise')}>
            <Wand2 size={16} color={colors.text} />
            <Text style={styles.presetText}>Sunrise</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          testID="btn-apply-temporary"
          style={[styles.actionBtn, { backgroundColor: local.accentColor }]}
          onPress={() => update(local)}
        >
          <Check size={18} color="#fff" />
          <Text style={styles.actionText}>Appliquer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="btn-save-branding"
          style={[styles.actionBtn, { backgroundColor: local.primaryColor }]}
          onPress={handleSave}
          disabled={!isDirty || saving}
        >
          <Save size={18} color="#fff" />
          <Text style={styles.actionText}>{saving ? 'Sauvegarde…' : 'Sauvegarder'}</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' && (
        <Text style={styles.helper}>Astuces: utilisez des URLs d&apos;images publiques (Unsplash, Cloudinary).</Text>
      )}
    </ScrollView>
  );
}

export default function BrandingScreen() {
  return (
    <ErrorBoundary>
      <BrandingProvider>
        <BrandingContent />
      </BrandingProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  preview: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.surface, margin: 16, borderRadius: 16 },
  logoWrap: { width: 96, height: 96, borderRadius: 20, borderWidth: 2, overflow: 'hidden', marginBottom: 12 },
  logo: { width: '100%', height: '100%' },
  appName: { fontSize: 22, fontWeight: '700' as const },
  tagline: { fontSize: 13, marginTop: 4, color: colors.textSecondary },
  colorRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  section: { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.text, marginBottom: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  colorInputs: { },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 999 },
  presetText: { fontSize: 13, color: colors.text },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  actionText: { color: '#fff', fontWeight: '700' as const },
  helper: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 12 },
});
