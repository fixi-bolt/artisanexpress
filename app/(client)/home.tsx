import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens } from '@/constants/design-tokens';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import Colors from '@/constants/colors';

export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMission } = useMissions();
  const hasNavigated = useRef(false);

  useScreenTracking('client_home');

  useEffect(() => {
    if (activeMission && !hasNavigated.current) {
      hasNavigated.current = true;
      setTimeout(() => {
        router.push('/tracking' as any);
      }, 0);
    } else if (!activeMission) {
      hasNavigated.current = false;
    }
  }, [activeMission, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Bonjour, {user?.name || 'Utilisateur'}</Text>
            <Text style={styles.subtitle}>Besoin d&apos;un artisan aujourd&apos;hui ?</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton}>
            <Image
              source={{ uri: user?.photo || 'https://i.pravatar.cc/150' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const color = (Colors.categories as any)[category.id];
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/request?category=${category.id}` as any)}
                testID={`category-${category.id}`}
              >
                <View style={[styles.categoryIcon, { backgroundColor: Colors.pastel.beige }]}>
                  <Text style={[styles.categoryEmoji, { color: color || Colors.primary }]}>🔧</Text>
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: Colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: DesignTokens.spacing[1],
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: Colors.white,
    opacity: 0.9,
  },
  avatarButton: {
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.borderRadius.full,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: DesignTokens.borderRadius['2xl'],
    borderTopRightRadius: DesignTokens.borderRadius['2xl'],
  },
  scrollContent: {
    paddingTop: DesignTokens.spacing[6],
  },
  categoriesGrid: {
    paddingHorizontal: DesignTokens.spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing[3],
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: DesignTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing[3],
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
});
