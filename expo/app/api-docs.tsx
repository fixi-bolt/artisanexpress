import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { KeyRound, Shield, ExternalLink } from 'lucide-react-native';

type PublicEndpoint = { name: string; method: string; path: string; description: string; exampleCurl: string };

export default function ApiDocsScreen() {
  const [label, setLabel] = useState<string>('server');
  const createKey = trpc.publicApi.createApiKey.useMutation();
  const endpoints = trpc.publicApi.listEndpoints.useQuery();
  const insets = useSafeAreaInsets();

  const onCreate = useCallback(async () => {
    console.log('Creating API key with label', label);
    await createKey.mutateAsync({ label });
  }, [createKey, label]);

  const keyInfo = createKey.data;
  const endpointList = endpoints.data ?? [];

  const baseUrl = useMemo(() => process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? '<BASE_URL>', []);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} contentContainerStyle={{ paddingBottom: 32 }} testID="api-docs-screen">
      <Stack.Screen options={{ title: 'API Publique' }} />

      <View style={styles.hero}>
        <Shield color="#111" size={22} />
        <Text style={styles.h1}>Accédez à l&apos;API ArtisanNow</Text>
        <Text style={styles.p}>Créez une clé API et intégrez ArtisanNow à vos outils.</Text>
        <Text style={styles.baseUrl}>Base URL: {baseUrl}/api</Text>
      </View>

      <View style={styles.card} testID="api-key-card">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <KeyRound color="#111" size={20} />
          <Text style={styles.cardTitle}>Clé API</Text>
        </View>
        {keyInfo ? (
          <View style={styles.keyBox}>
            <Text selectable style={styles.keyText}>{keyInfo.apiKey}</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={onCreate} style={styles.primaryBtn} testID="create-key-btn">
            <Text style={styles.primaryText}>Créer une clé</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card} testID="endpoints-card">
        <Text style={styles.cardTitle}>Endpoints</Text>
        {endpointList.map((e: PublicEndpoint, idx: number) => (
          <View key={idx} style={styles.endpoint}>
            <View style={styles.endpointHeader}>
              <Text style={styles.method}>{e.method}</Text>
              <Text style={styles.path}>{e.path}</Text>
            </View>
            <Text style={styles.desc}>{e.description}</Text>
            <View style={styles.codeBox}>
              <Text selectable style={styles.code}>{e.exampleCurl}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.linkRow} testID="more-docs">
        <ExternalLink color="#2563EB" size={16} />
        <Text style={styles.link}>Voir documentation complète</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  hero: { padding: 16, gap: 6 },
  h1: { fontSize: 20, fontWeight: '700' },
  p: { color: '#4B5563' },
  baseUrl: { marginTop: 4, color: '#111827', fontWeight: '600' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  keyBox: { backgroundColor: '#0B1220', padding: 12, borderRadius: 8, marginTop: 10 },
  keyText: { color: '#10B981', fontWeight: '700' },
  endpoint: { marginTop: 12 },
  endpointHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  method: { backgroundColor: '#E5F3FF', color: '#1D4ED8', fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  path: { fontWeight: '700' },
  desc: { marginTop: 6, color: '#374151' },
  codeBox: { backgroundColor: '#0B1220', padding: 12, borderRadius: 8, marginTop: 8 },
  code: { color: '#E5E7EB', fontFamily: 'Courier', fontSize: 12 },
  primaryBtn: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  primaryText: { color: '#fff', fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 16 },
  link: { color: '#2563EB', fontWeight: '600' },
});
