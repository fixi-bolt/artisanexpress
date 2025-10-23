import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMemo, useCallback } from 'react';
import Colors from '@/constants/colors';
import { categories } from '@/mocks/artisans';
import { ShieldCheck, ShoppingBag, TicketPercent, MapPin, Sparkles, Home, Car, Wrench } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SuperHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const clusters = useMemo(() => {
    const byId = Object.fromEntries(categories.map(c => [c.id, c]));

    return [
      {
        key: 'home_services',
        title: 'Maison & Réparations',
        icon: <Home size={18} color={Colors.primary} strokeWidth={2} />,
        items: ['plumber', 'electrician', 'locksmith', 'painter', 'carpenter', 'hvac', 'cleaner'].filter(id => byId[id as keyof typeof byId]).map(id => byId[id as keyof typeof byId]),
      },
      {
        key: 'mobility',
        title: 'Mobilité & Déménagement',
        icon: <Car size={18} color={Colors.primary} strokeWidth={2} />,
        items: ['mechanic', 'auto_body', 'mover', 'welder'].filter(id => byId[id as keyof typeof byId]).map(id => byId[id as keyof typeof byId]),
      },
      {
        key: 'specialities',
        title: 'Spécialités & Tech',
        icon: <Wrench size={18} color={Colors.primary} strokeWidth={2} />,
        items: ['it_tech', 'home_automation', 'glazier', 'refrigeration', 'pool_tech', 'gardener', 'interior_designer'].filter(id => byId[id as keyof typeof byId]).map(id => byId[id as keyof typeof byId]),
      },
    ];
  }, []);

  const goCategory = useCallback((id: string) => {
    console.log('[SuperHub] Go category', id);
    router.push(`/request?category=${id}` as any);
  }, [router]);

  const go = useCallback((path: string) => {
    console.log('[SuperHub] Navigate', path);
    router.push(path as any);
  }, [router]);

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Super App', headerStyle: { backgroundColor: Colors.background } }} />
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} testID="superHubScroll">
        <View style={styles.hero} testID="superHubHero">
          <View style={styles.heroLeft}>
            <Text style={styles.heroEyebrow}>Un seul compte, tous les services</Text>
            <Text style={styles.heroTitle}>ArtisanNow Super App</Text>
            <Text style={styles.heroSubtitle}>Réparez, déménagez, nettoyez, installez. 24/7.</Text>
            <View style={styles.heroCtas}>
              <TouchableOpacity style={styles.primaryCta} onPress={() => go('/(client)/marketplace' as any)} activeOpacity={0.85} testID="ctaMarketplace">
                <ShoppingBag size={18} color={Colors.surface} strokeWidth={2} />
                <Text style={styles.primaryCtaText}>Marketplace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryCta} onPress={() => go('/ai-assistant' as any)} activeOpacity={0.85} testID="ctaAI">
                <Sparkles size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.secondaryCtaText}>Assistant IA</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.badge}>
              <Sparkles size={16} color={Colors.surface} strokeWidth={2} />
              <Text style={styles.badgeText}>Nouveaux services</Text>
            </View>
            <View style={styles.badgeOutline}>
              <MapPin size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.badgeOutlineText}>Couverture nationale</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => go('/ai-assistant' as any)} activeOpacity={0.85} testID="quickAI">
            <Sparkles size={20} color={Colors.surface} strokeWidth={2} />
            <Text style={styles.quickCardTitle}>Assistant IA</Text>
            <Text style={styles.quickCardSub}>Décrivez et laissez-nous organiser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCardOutline} onPress={() => go('/(client)/transactions' as any)} activeOpacity={0.85} testID="quickFinance">
            <TicketPercent size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.quickCardTitleOutline}>Avantages & factures</Text>
            <Text style={styles.quickCardSubOutline}>Suivez vos dépenses</Text>
          </TouchableOpacity>
        </View>

        {clusters.map(cluster => (
          <View key={cluster.key} style={styles.cluster}>
            <View style={styles.clusterHeader}>
              {cluster.icon}
              <Text style={styles.clusterTitle}>{cluster.title}</Text>
            </View>
            <View style={styles.grid}>
              {cluster.items.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.card, { backgroundColor: Colors.categories[c.id] + '15' }]}
                  onPress={() => goCategory(c.id)}
                  activeOpacity={0.85}
                  testID={`hub-${c.id}`}
                >
                  <View style={[styles.iconWrap, { backgroundColor: Colors.categories[c.id] }]}>
                    <Text style={styles.emoji}>{c.emoji}</Text>
                  </View>
                  <Text style={styles.label}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.safety}>
          <ShieldCheck size={18} color={Colors.surface} strokeWidth={2} />
          <Text style={styles.safetyText}>Paiements sécurisés, artisans vérifiés, assistance 24/7</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 80 },
  hero: { backgroundColor: Colors.primary, borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  heroLeft: { flex: 1 },
  heroRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  heroEyebrow: { color: Colors.surface, opacity: 0.9, fontSize: 12 },
  heroTitle: { color: Colors.surface, fontSize: 22, fontWeight: '700' as const, marginTop: 6 },
  heroSubtitle: { color: Colors.surface, opacity: 0.9, marginTop: 6 },
  heroCtas: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryCta: { flexDirection: 'row', gap: 8, backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  primaryCtaText: { color: Colors.surface, fontWeight: '700' as const },
  secondaryCta: { flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  secondaryCtaText: { color: Colors.primary, fontWeight: '700' as const },
  badge: { flexDirection: 'row', gap: 6, backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: Colors.surface, fontWeight: '700' as const, fontSize: 12 },
  badgeOutline: { flexDirection: 'row', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 8 },
  badgeOutlineText: { color: Colors.primary, fontWeight: '700' as const, fontSize: 12 },
  sectionHeader: { marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quickCard: { flex: 1, backgroundColor: Colors.secondary, borderRadius: 16, padding: 16 },
  quickCardOutline: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: Colors.primary + '30' },
  quickCardTitle: { color: Colors.surface, fontWeight: '700' as const, marginTop: 6 },
  quickCardTitleOutline: { color: Colors.primary, fontWeight: '700' as const, marginTop: 6 },
  quickCardSub: { color: Colors.surface, opacity: 0.9, fontSize: 12, marginTop: 2 },
  quickCardSubOutline: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  cluster: { marginTop: 24 },
  clusterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  clusterTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  card: { width: (SCREEN_WIDTH - 72) / 2, margin: 6, borderRadius: 16, padding: 16, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emoji: { fontSize: 28 },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, textAlign: 'center' },
  safety: { marginTop: 28, backgroundColor: Colors.text, padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  safetyText: { color: Colors.surface, fontWeight: '600' as const },
});