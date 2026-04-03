import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { BrandingProvider, useBranding } from '@/contexts/BrandingContext';
import { Copy, ExternalLink, Download } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function PressKitContent() {
  const { branding } = useBranding();
  const insets = useSafeAreaInsets();

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  const copy = async (text: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
        await (navigator as any).clipboard.writeText(text);
      } else {
        console.log('[PressKit] Copy fallback', text);
      }
    } catch (e) {
      console.error('[PressKit] Clipboard error', e);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      <Stack.Screen options={{ title: 'Press Kit' }} />

      <View style={styles.card} testID="presskit-identity">
        <Text style={styles.title}>Identité</Text>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{branding.appName}</Text>
        {branding.tagline ? (
          <>
            <Text style={styles.label}>Tagline</Text>
            <Text style={styles.value}>{branding.tagline}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.card} testID="presskit-logo">
        <Text style={styles.title}>Logo</Text>
        <View style={styles.logoWrap}>
          <Image source={{ uri: branding.logoUrl }} style={styles.logo} />
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: branding.primaryColor }]} onPress={() => open(branding.logoUrl)}>
            <Download size={16} color="#fff" />
            <Text style={styles.btnText}>Ouvrir</Text>
            <ExternalLink size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: branding.secondaryColor }]} onPress={() => copy(branding.logoUrl)}>
            <Copy size={16} color="#fff" />
            <Text style={styles.btnText}>Copier URL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card} testID="presskit-colors">
        <Text style={styles.title}>Couleurs</Text>
        <View style={styles.colorsRow}>
          <View style={styles.colorItem}>
            <View style={[styles.swatch, { backgroundColor: branding.primaryColor }]} />
            <Text style={styles.value}>{branding.primaryColor}</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.swatch, { backgroundColor: branding.secondaryColor }]} />
            <Text style={styles.value}>{branding.secondaryColor}</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.swatch, { backgroundColor: branding.accentColor }]} />
            <Text style={styles.value}>{branding.accentColor}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card} testID="presskit-links">
        <Text style={styles.title}>Liens</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => open('https://www.notion.so/your-pitch-deck')}>
          <Text style={styles.linkText}>Pitch Deck</Text>
          <ExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => open('https://www.figma.com/file/placeholder')}>
          <Text style={styles.linkText}>Design System</Text>
          <ExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => open('https://youtu.be/dQw4w9WgXcQ')}>
          <Text style={styles.linkText}>Vidéo démo</Text>
          <ExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function PressKitScreen() {
  return (
    <ErrorBoundary>
      <BrandingProvider>
        <PressKitContent />
      </BrandingProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' as const, color: colors.text, marginBottom: 12 },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 14, color: colors.text, fontWeight: '600' as const, marginTop: 2 },
  logoWrap: { width: '100%', aspectRatio: 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 12 },
  logo: { width: '100%', height: '100%' },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700' as const },
  colorsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  colorItem: { alignItems: 'center', flex: 1 },
  swatch: { width: '90%', height: 40, borderRadius: 8, marginBottom: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  linkText: { color: colors.primary, fontWeight: '600' as const, fontSize: 14 },
});