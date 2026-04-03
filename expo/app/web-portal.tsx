import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Users, Wrench, LayoutGrid, Globe, Box } from 'lucide-react-native';

export default function WebPortalScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="web-portal-screen">
      <Stack.Screen options={{ title: 'Portail Web' }} />

      <Text style={styles.h1}>Portail ArtisanNow</Text>
      <Text style={styles.sub}>Accès rapide pour Clients et Artisans — 100% responsive</Text>

      <View style={[styles.grid, isWide ? styles.gridWide : styles.gridNarrow]}>
        <Card title="Espace Client" icon={<Users color="#111" size={22} />} onPress={() => router.push('/(client)/home')} testID="client-card" />
        <Card title="Espace Artisan" icon={<Wrench color="#111" size={22} />} onPress={() => router.push('/(artisan)/dashboard')} testID="artisan-card" />
        <Card title="Automatisations" icon={<LayoutGrid color="#111" size={22} />} onPress={() => router.push('/automation')} testID="automation-card" />
        <Card title="API Publique" icon={<Globe color="#111" size={22} />} onPress={() => router.push('/api-docs')} testID="api-card" />
        <Card title="Marketplace" icon={<Box color="#111" size={22} />} onPress={() => router.push('/(client)/marketplace')} testID="marketplace-card" />
      </View>
    </View>
  );
}

function Card({ title, icon, onPress, testID }: { title: string; icon: React.ReactElement; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} testID={testID}>
      <Text style={styles.iconWrap}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8F9FB' },
  h1: { fontSize: 22, fontWeight: '800' },
  sub: { color: '#4B5563', marginTop: 6 },
  grid: { flex: 1, marginTop: 16, gap: 12 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' as const },
  gridNarrow: { flexDirection: 'column' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, minHeight: 120, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  iconWrap: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
});
