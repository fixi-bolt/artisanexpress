import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, NativeScrollEvent, NativeSyntheticEvent, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Search, Sparkles, ChevronDown, ChevronUp, MapPin, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { ArtisanCategory } from '@/types';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/components/MapView';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Input, Badge, IconButton } from '@/components/ui';

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

  const [region, setRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (position) {
      setRegion(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude,
      }));
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

  const mapHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [320, 0],
    extrapolate: 'clamp',
  });

  const mapOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.mapContainer, 
          { 
            paddingTop: insets.top,
            height: mapHeight,
            opacity: mapOpacity,
          }
        ]}
      >
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          testID="map-view"
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="Paris"
            description="Votre position"
          />
        </MapView>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View>
                <Text style={styles.greeting}>Bonjour</Text>
                <Text style={styles.userName}>{user?.name || 'Client'}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon={MapPin}
                onPress={() => console.log('Location')}
                variant="default"
                size="md"
              />
            </View>
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
              <Sparkles size={18} color={Colors.surface} strokeWidth={2} />
              <Text style={styles.superAppButtonText}>Ouvrir la Super App</Text>
              <View style={styles.superAppBadge}><Text style={styles.superAppBadgeText}>Nouveau</Text></View>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: Colors.categories[category.id] + '15' }
                ]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View 
                  style={[
                    styles.categoryIconContainer,
                    { backgroundColor: Colors.categories[category.id] }
                  ]}
                >
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
              <ChevronUp size={20} color={Colors.primary} strokeWidth={2} />
            ) : (
              <ChevronDown size={20} color={Colors.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          {showAllCategories && (
            <View style={styles.expandedSection}>
              <View style={styles.customSearchContainer}>
                <Search size={18} color={Colors.textLight} strokeWidth={2} />
                <TextInput
                  placeholder="Rechercher ou saisir une spécialité..."
                  placeholderTextColor={Colors.textLight}
                  value={customSpecialty}
                  onChangeText={setCustomSpecialty}
                  style={styles.customSearchInput}
                  returnKeyType="done"
                  testID="customSpecialtyInput"
                />
                {customSpecialty.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setCustomSpecialty('')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color={Colors.textLight} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.categoriesGrid}>
                {filteredOtherCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: Colors.categories[category.id] + '15' }
                    ]}
                    onPress={() => {
                      toggleAllCategories();
                      handleCategoryPress(category.id);
                    }}
                    activeOpacity={0.7}
                    testID={`expandedCategory-${category.id}`}
                  >
                    <View 
                      style={[
                        styles.categoryIconContainer,
                        { backgroundColor: Colors.categories[category.id] }
                      ]}
                    >
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
              <Sparkles size={24} color={Colors.surface} strokeWidth={2} fill={Colors.surface} />
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
                <X size={24} color={Colors.text} strokeWidth={2} />
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
                      { backgroundColor: Colors.categories[category.id] + '15' }
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
                        { backgroundColor: Colors.categories[category.id] }
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
    backgroundColor: AppColors.background,
  },
  mapContainer: {
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: DesignTokens.spacing[2],
  },
  greeting: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.text.secondary,
    marginBottom: DesignTokens.spacing[1],
    fontWeight: DesignTokens.typography.fontWeight.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: DesignTokens.typography.fontSize['3xl'],
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    color: AppColors.text.primary,
    letterSpacing: -0.5,
  },
  searchContainer: {
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
    ...DesignTokens.shadows.md,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  categoryIconContainer: {
    width: 72,
    height: 72,
    borderRadius: DesignTokens.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing[3],
    ...DesignTokens.shadows.sm,
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
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  aiAssistantIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAssistantContent: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 4,
  },
  aiAssistantSubtitle: {
    fontSize: 13,
    color: Colors.surface,
    opacity: 0.9,
    lineHeight: 18,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expandedSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  customSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary + '20',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  customSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  noResultsText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  customRequestButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  customRequestButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  moreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  superAppButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  superAppButtonText: {
    color: Colors.surface,
    fontWeight: '700' as const,
  },
  superAppBadge: {
    marginLeft: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  superAppBadgeText: {
    color: Colors.surface,
    fontWeight: '700' as const,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  modalCategoryCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    margin: 6,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalCategoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCategoryEmoji: {
    fontSize: 32,
  },
  modalCategoryLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
});
