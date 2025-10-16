import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Sparkles, ChevronDown, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { ArtisanCategory } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMission } = useMissions();
  const hasNavigated = useRef(false);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  
  useScreenTracking('client_home');

  const priorityCategories = categories.filter(c => c.isPriority);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCategories = normalizedQuery.length > 0
    ? categories.filter(c => c.label.toLowerCase().includes(normalizedQuery) || c.id.toLowerCase().includes(normalizedQuery))
    : priorityCategories;

  const handleCategoryPress = (category: ArtisanCategory) => {
    console.log('Selected category:', category);
    router.push(`/request?category=${category}` as any);
  };

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
      <View style={[styles.mapPlaceholder, { paddingTop: insets.top }]}>
        <View style={styles.mapOverlay}>
          <Text style={styles.mapText}>🗺️</Text>
          <Text style={styles.mapSubtext}>Carte interactive</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.userName}>{user?.name || 'Client'}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color={Colors.textLight} strokeWidth={2} />
            <TextInput
              placeholder="Rechercher un artisan..."
              placeholderTextColor={Colors.textLight}
              value={query}
              onChangeText={(text) => {
                console.log('Search query changed:', text);
                setQuery(text);
              }}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (filteredCategories.length === 1) {
                  handleCategoryPress(filteredCategories[0].id);
                } else if (filteredCategories.length > 1) {
                  setShowAllCategories(true);
                }
              }}
              testID="searchInput"
            />
          </View>
        </View>

        <ScrollView 
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Choisissez un artisan</Text>
              <View style={styles.badge247}>
                <Text style={styles.badge247Text}>24/7</Text>
              </View>
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
            onPress={() => setShowAllCategories(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.moreButtonText}>Voir tous les artisans</Text>
            <ChevronDown size={20} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>

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
        </ScrollView>
      </View>

      {showAllCategories && (
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
                {categories.map((category) => (
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
    backgroundColor: Colors.background,
  },
  mapPlaceholder: {
    height: 320,
    backgroundColor: Colors.primaryLight + '30',
    position: 'relative',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 72,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    marginTop: -30,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  categoriesScroll: {
    flex: 1,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  badge247: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badge247Text: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  categoryCard: {
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
  categoryIconContainer: {
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
  categoryEmoji: {
    fontSize: 32,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
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
