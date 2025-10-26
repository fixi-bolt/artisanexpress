import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { mockArtisans, categories } from '@/mocks/artisans';
import { Artisan } from '@/types';
import { Star, MapPin, Clock, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

function getCategoryLabel(id: Artisan['category']): string {
  const found = categories.find(c => c.id === id);
  return found?.label ?? id;
}

export default function AllArtisansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);

  const priorityCategories = useMemo(() => categories.filter(c => c.isPriority), []);
  const otherCategories = useMemo(() => categories.filter(c => !c.isPriority), []);

  const data = useMemo<Artisan[]>(() => mockArtisans, []);

  const renderItem = useCallback(({ item }: { item: Artisan }) => {
    const color = (Colors as any).categories[item.category as keyof (typeof Colors)['categories']];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          console.log('Open artisan', item.id);
          router.push(`/request?category=${item.category}` as any);
        }}
        testID={`artisan-${item.id}`}
      >
        <Image source={{ uri: item.photo ?? 'https://i.pravatar.cc/150' }} style={styles.avatar} />
        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.badge, { backgroundColor: (color ?? Colors.primary) + '20' }]}> 
              <Text style={[styles.badgeText, { color: color ?? Colors.primary }]}>{getCategoryLabel(item.category)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Star size={16} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.metaText}>{item.rating?.toFixed(1) ?? '—'} ({item.reviewCount ?? 0})</Text>
            <Clock size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{item.hourlyRate}€/h</Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>Rayon {item.interventionRadius} km</Text>
            <View style={[styles.dot, { backgroundColor: item.isAvailable ? Colors.success : Colors.error }]} />
            <Text style={[styles.metaText, { color: item.isAvailable ? Colors.success : Colors.error }]}>
              {item.isAvailable ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: color ?? Colors.primary }]}
            onPress={() => {
              console.log('Request with artisan category', item.category);
              router.push(`/request?category=${item.category}` as any);
            }}
            activeOpacity={0.9}
            testID={`cta-${item.id}`}
          >
            <Text style={styles.ctaText}>Demander une intervention</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS === 'ios' ? insets.top : 12) as number }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          testID="back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Tous les artisans</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories populaires</Text>
          <View style={styles.grid}>
            {priorityCategories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.catPill}
                onPress={() => {
                  console.log('Open category', c.id);
                  router.push(`/request?category=${c.id}` as any);
                }}
                activeOpacity={0.85}
                testID={`cat-${c.id}`}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={styles.catLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setIsMoreOpen((v) => !v)}
            activeOpacity={0.8}
            testID="toggle-more-cats"
          >
            <Text style={styles.dropdownToggleText}>Voir plus de catégories</Text>
            {isMoreOpen ? <ChevronUp size={18} color={Colors.text} /> : <ChevronDown size={18} color={Colors.text} />}
          </TouchableOpacity>

          {isMoreOpen && (
            <View style={styles.dropdown} testID="more-cats">
              {otherCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    console.log('Open category from dropdown', c.id);
                    setIsMoreOpen(false);
                    router.push(`/request?category=${c.id}` as any);
                  }}
                  activeOpacity={0.8}
                  testID={`more-cat-${c.id}`}
                >
                  <Text style={styles.dropdownEmoji}>{c.emoji}</Text>
                  <Text style={styles.dropdownLabel}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun artisan trouvé</Text>
            <Text style={styles.emptyText}>Essayez un autre mot-clé.</Text>
          </View>
        ) : (
          <View style={styles.artisansList}>
            {data.map((item, index) => (
              <View key={item.id}>
                {renderItem({ item })}
                {index < data.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  title: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  section: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: Colors.surface },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 10 },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight },
  catEmoji: { fontSize: 16, marginRight: 8 },
  catLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' as const },
  dropdownToggle: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownToggleText: { fontSize: 14, color: Colors.text, fontWeight: '700' as const },
  dropdown: { marginTop: 8, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  artisansList: { padding: 16, paddingBottom: 40 },
  dropdownEmoji: { fontSize: 16, marginRight: 8 },
  dropdownLabel: { fontSize: 14, color: Colors.text },

  separator: { height: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: { width: 68, height: 68, borderRadius: 14, backgroundColor: Colors.background },
  cardBody: { flex: 1, marginLeft: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' as const },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cta: { marginTop: 10, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  ctaText: { color: Colors.surface, fontWeight: '700' as const },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  emptyText: { marginTop: 6, color: Colors.textSecondary },
});