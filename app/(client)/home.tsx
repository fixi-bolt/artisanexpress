import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { ArtisanCategory } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Input, Badge } from '@/components/ui';
import RetractableMap from '@/components/RetractableMap';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMission } = useMissions();
  const hasNavigated = useRef(false);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef<number>(0);
  
  const { position } = useGeolocation({
    enabled: true,
    onLocationUpdate: async (pos) => {
      console.log('📍 User location updated:', pos);
      if (user?.id) {
        try {
          await supabase
            .from('users')
            .update({
              latitude: pos.latitude,
              longitude: pos.longitude,
            })
            .eq('id', user.id);
          console.log('✅ Location saved to database');
        } catch (error) {
          console.error('❌ Failed to save location:', error);
        }
      }
    },
  });

  useEffect(() => {
    if (position) {
      console.log('Position updated:', position);
    }
  }, [position]);
  
  useScreenTracking('client_home');

  const priorityCategories = useMemo(
    () => categories.filter(c => c.isPriority).slice(0, 10),
    []
  );
  
  const otherCategories = useMemo(
    () => categories.filter(c => !c.isPriority),
    []
  );
  
  const normalizedQuery = useMemo(
    () => query.trim().toLowerCase(),
    [query]
  );
  
  const filteredCategories = useMemo(
    () => normalizedQuery.length > 0
      ? categories.filter(c => c.label.toLowerCase().includes(normalizedQuery) || c.id.toLowerCase().includes(normalizedQuery))
      : priorityCategories,
    [normalizedQuery, priorityCategories]
  );

  const filteredOtherCategories = useMemo(
    () => customSpecialty.trim().length > 0
      ? otherCategories.filter(c => c.label.toLowerCase().includes(customSpecialty.trim().toLowerCase()))
      : otherCategories,
    [customSpecialty, otherCategories]
  );

  const handleCategoryPress = useCallback((category: ArtisanCategory) => {
    console.log('Selected category:', category);
    router.push(`/request?category=${category}` as any);
  }, [router]);

  const navigateToTracking = useCallback(() => {
    if (activeMission && !hasNavigated.current) {
      hasNavigated.current = true;
      setTimeout(() => {
        router.push('/tracking' as any);
      }, 0);
    } else if (!activeMission) {
      hasNavigated.current = false;
    }
  }, [activeMission, router]);

  useEffect(() => {
    navigateToTracking();
  }, [navigateToTracking]);

  const toggleAllCategories = useCallback(() => {
    setShowAllCategories(!showAllCategories);
    if (!showAllCategories) {
      setCustomSpecialty('');
    }
  }, [showAllCategories]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    lastScrollY.current = currentScrollY;
    handleScroll(event);
  }, [handleScroll]);



  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(client)/profile' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'J')[0].toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Bonjour, {user?.name || 'Alexandre'}</Text>
            <Text style={styles.subGreeting}>Besoin d&apos;un artisan aujourd&apos;hui ?</Text>
          </View>

          <View style={styles.searchContainer}>
            <Input
              placeholder="Rechercher un artisan..."
              value={query}
              onChangeText={(text) => {
                console.log('Search query changed:', text);
                setQuery(text);
              }}
              leftIcon={Search}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (filteredCategories.length === 1) {
                  handleCategoryPress(filteredCategories[0].id);
                } else if (filteredCategories.length > 1) {
                  setShowAllCategories(true);
                }
              }}
              containerStyle={styles.searchInputContainerStyle}
            />
          </View>

          {position && (
            <View style={styles.mapContainer}>
              <RetractableMap
                latitude={position.latitude}
                longitude={position.longitude}
                showUserLocation={true}
                testID="home-map"
              />
            </View>
          )}

          <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Choisissez un artisan</Text>
              <Badge label="24/7" variant="primary" size="sm" />
            </View>
            <Text style={styles.sectionSubtitle}>
              Sélectionnez le type d&apos;intervention dont vous avez besoin
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(client)/super-hub' as any)}
              style={styles.superAppButton}
              activeOpacity={0.8}
              testID="openSuperHub"
            >
              <Sparkles size={18} color={AppColors.text.inverse} strokeWidth={2} />
              <Text style={styles.superAppButtonText}>Ouvrir la Super App</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconContainer}>
                  <Text style={styles.categoryEmoji}>
                    {category.emoji}
                  </Text>
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.moreButton}
            onPress={toggleAllCategories}
            activeOpacity={0.7}
            testID="toggleAllCategories"
          >
            <Text style={styles.moreButtonText}>
              {showAllCategories ? 'Masquer les artisans' : 'Voir tous les artisans'}
            </Text>
            {showAllCategories ? (
              <ChevronUp size={20} color={AppColors.primary} strokeWidth={2} />
            ) : (
              <ChevronDown size={20} color={AppColors.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          {showAllCategories && (
            <View style={styles.expandedSection}>
              <Input
                placeholder="Rechercher ou saisir une spécialité..."
                value={customSpecialty}
                onChangeText={setCustomSpecialty}
                leftIcon={Search}
                returnKeyType="done"
                testID="customSpecialtyInput"
              />

              <View style={styles.categoriesGrid}>
                {filteredOtherCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      toggleAllCategories();
                      handleCategoryPress(category.id);
                    }}
                    activeOpacity={0.7}
                    testID={`expandedCategory-${category.id}`}
                  >
                    <View style={styles.categoryIconContainer}>
                      <Text style={styles.categoryEmoji}>
                        {category.emoji}
                      </Text>
                    </View>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {customSpecialty.length > 0 && filteredOtherCategories.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>Aucune spécialité trouvée</Text>
                  <TouchableOpacity
                    style={styles.customRequestButton}
                    onPress={() => {
                      console.log('Custom specialty request:', customSpecialty);
                      toggleAllCategories();
                      router.push(`/request?customSpecialty=${encodeURIComponent(customSpecialty)}` as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.customRequestButtonText}>Faire une demande personnalisée</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.aiAssistantButton} 
            onPress={() => router.push('/ai-assistant' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.aiAssistantIconContainer}>
              <Sparkles size={24} color={AppColors.text.inverse} strokeWidth={2} fill={AppColors.text.inverse} />
            </View>
            <View style={styles.aiAssistantContent}>
              <Text style={styles.aiAssistantTitle}>✨ Assistant IA</Text>
              <Text style={styles.aiAssistantSubtitle}>
                Décrivez votre problème et obtenez une estimation
              </Text>
            </View>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {false && (
        <View style={styles.modalOverlay} testID="allCategoriesOverlay">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tous les artisans</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAllCategories(false)}
                activeOpacity={0.7}
                testID="closeAllCategories"
              >
                <Text>X</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 0 }} />

            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalGrid}>
                {otherCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.modalCategoryCard,
                      { backgroundColor: AppColors.surface }
                    ]}
                    onPress={() => {
                      setShowAllCategories(false);
                      handleCategoryPress(category.id);
                    }}
                    activeOpacity={0.7}
                    testID={`modalCategory-${category.id}`}
                  >
                    <View 
                      style={[
                        styles.modalCategoryIconContainer,
                        { backgroundColor: AppColors.primary }
                      ]}
                    >
                      <Text style={styles.modalCategoryEmoji}>
                        {category.emoji}
                      </Text>
                    </View>
                    <Text style={styles.modalCategoryLabel}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  headerContainer: {
    backgroundColor: AppColors.primary,
    paddingBottom: DesignTokens.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[4],
  },
  greetingSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },
  greeting: {
    fontSize: DesignTokens.typography.fontSize['3xl'],
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    color: AppColors.text.primary,
    marginBottom: DesignTokens.spacing[1],
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  avatarButton: {
    marginLeft: DesignTokens.spacing[2],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: DesignTokens.borderRadius['2xl'],
    borderTopRightRadius: DesignTokens.borderRadius['2xl'],
    minHeight: '100%',
    paddingTop: DesignTokens.spacing[6],
    paddingBottom: 120,
  },
  searchContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[4],
  },
  mapContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[6],
  },
  searchInputContainerStyle: {
    marginBottom: 0,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[3],
    ...DesignTokens.shadows.md,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.primary,
    paddingVertical: 0,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  categoriesContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[10],
  },
  sectionHeader: {
    marginBottom: DesignTokens.spacing[5],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
    marginBottom: DesignTokens.spacing[1],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    color: AppColors.text.primary,
    letterSpacing: -0.5,
  },
  badge247: {
    backgroundColor: AppColors.accent,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.md,
    ...DesignTokens.shadows.sm,
  },
  badge247Text: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    color: AppColors.text.inverse,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
    lineHeight: DesignTokens.typography.fontSize.base * DesignTokens.typography.lineHeight.relaxed,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -DesignTokens.spacing[1],
    marginBottom: DesignTokens.spacing[4],
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    margin: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[5],
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    ...DesignTokens.shadows.md,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  categoryIconContainer: {
    width: 72,
    height: 72,
    borderRadius: DesignTokens.borderRadius.xl,
    backgroundColor: AppColors.pastel.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing[3],
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
  aiAssistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[5],
    gap: DesignTokens.spacing[4],
    ...DesignTokens.shadows.lg,
  },
  aiAssistantIconContainer: {
    width: 56,
    height: 56,
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAssistantContent: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.inverse,
    marginBottom: DesignTokens.spacing[1],
  },
  aiAssistantSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.text.inverse,
    opacity: 0.9,
    lineHeight: DesignTokens.typography.fontSize.sm * DesignTokens.typography.lineHeight.normal,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingVertical: DesignTokens.spacing[4],
    paddingHorizontal: DesignTokens.spacing[5],
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[2],
    marginBottom: DesignTokens.spacing[4],
    borderWidth: 2,
    borderColor: AppColors.primary + '30',
    ...DesignTokens.shadows.sm,
  },
  expandedSection: {
    marginTop: DesignTokens.spacing[2],
    paddingTop: DesignTokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: AppColors.border.light,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing[8],
    gap: DesignTokens.spacing[4],
  },
  noResultsText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  customRequestButton: {
    backgroundColor: AppColors.primary,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[6],
    ...DesignTokens.shadows.md,
  },
  customRequestButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.text.inverse,
    textAlign: 'center',
  },
  moreButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.primary,
  },
  superAppButton: {
    marginTop: DesignTokens.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
    backgroundColor: AppColors.primary,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
    alignSelf: 'flex-start',
    ...DesignTokens.shadows.md,
  },
  superAppButtonText: {
    color: AppColors.text.inverse,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    fontSize: DesignTokens.typography.fontSize.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: DesignTokens.borderRadius['2xl'],
    borderTopRightRadius: DesignTokens.borderRadius['2xl'],
    maxHeight: '90%',
    paddingBottom: DesignTokens.spacing[10],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.light,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.primary,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: DesignTokens.spacing[6],
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -DesignTokens.spacing[1],
  },
  modalCategoryCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    margin: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[5],
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    ...DesignTokens.shadows.sm,
  },
  modalCategoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: DesignTokens.borderRadius.xl,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing[3],
    ...DesignTokens.shadows.sm,
  },
  modalCategoryEmoji: {
    fontSize: 32,
  },
  modalCategoryLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.text.primary,
    textAlign: 'center',
  },
});
