import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';

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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Bonjour, {user?.name || 'Utilisateur'}</Text>
          <Text style={styles.subtitle}>Besoin d&apos;un artisan aujourd&apos;hui ?</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/request?category=${category.id}` as any)}
              activeOpacity={0.8}
              testID={`category-${category.id}`}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[6],
    backgroundColor: AppColors.primary,
    borderBottomLeftRadius: DesignTokens.borderRadius['2xl'],
    borderBottomRightRadius: DesignTokens.borderRadius['2xl'],
  },
  greetingContainer: {
    gap: DesignTokens.spacing[1],
  },
  greeting: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.surface,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.surface,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: DesignTokens.spacing[6],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing[4],
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius['2xl'],
    padding: DesignTokens.spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing[3],
    ...DesignTokens.shadows.md,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  iconContainer: {
    width: 72,
    height: 72,
    backgroundColor: AppColors.primary,
    borderRadius: DesignTokens.borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 36,
  },
  categoryLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.text.primary,
    textAlign: 'center',
  },
});
