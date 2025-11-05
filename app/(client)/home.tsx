import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens } from '@/constants/design-tokens';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import Colors from '@/constants/colors';
import { Search, ChevronDown, ChevronUp, Star, MapPin } from 'lucide-react-native';
import { mockArtisans } from '@/mocks/artisans';

const SPECIALTIES = [
  { id: 'plumber', label: 'Plombier', emoji: '🔧', visible: true },
  { id: 'electrician', label: 'Électricien', emoji: '⚡', visible: true },
  { id: 'carpenter', label: 'Menuisier', emoji: '🪚', visible: true },
  { id: 'mason', label: 'Maçon', emoji: '🧱', visible: true },
  { id: 'painter', label: 'Peintre', emoji: '🎨', visible: true },
  { id: 'roofer', label: 'Couvreur', emoji: '🔨', visible: true },
  { id: 'locksmith', label: 'Serrurier', emoji: '🚪', visible: true },
  { id: 'hvac', label: 'Chauffagiste', emoji: '❄️', visible: true },
  { id: 'glazier', label: 'Vitrier', emoji: '🪠', visible: true },
  { id: 'cleaner', label: 'Agent de nettoyage', emoji: '🧹', visible: true },
  { id: 'mechanic', label: 'Mécanicien à domicile', emoji: '🧰', visible: false },
  { id: 'appliance_repair', label: 'Dépanneur électroménager', emoji: '🧼', visible: false },
  { id: 'gardener', label: 'Jardinier / Paysagiste', emoji: '🏡', visible: false },
  { id: 'interior_designer', label: 'Décorateur d\'intérieur', emoji: '🪴', visible: false },
  { id: 'handyman', label: 'Technicien multiservices', emoji: '🧯', visible: false },
  { id: 'auto_body', label: 'Carrossier', emoji: '🚗', visible: false },
  { id: 'chimney_sweep', label: 'Ramoneur', emoji: '🔥', visible: false },
  { id: 'framer', label: 'Charpentier', emoji: '🪵', visible: false },
  { id: 'housekeeper', label: 'Femme de ménage / aide à domicile', emoji: '🧽', visible: false },
  { id: 'it_tech', label: 'Technicien informatique', emoji: '💻', visible: false },
  { id: 'mover', label: 'Déménageur', emoji: '📦', visible: false },
  { id: 'welder', label: 'Soudeur', emoji: '🧑‍🏭', visible: false },
  { id: 'pool_tech', label: 'Pisciniste', emoji: '🚰', visible: false },
  { id: 'refrigeration', label: 'Climaticien / Frigoriste', emoji: '🌬️', visible: false },
  { id: 'pest_control', label: 'Dératisation / nuisible', emoji: '🐀', visible: false },
  { id: 'home_automation', label: 'Installateur domotique / alarme', emoji: '🧩', visible: false },
];

export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMission } = useMissions();
  const hasNavigated = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const filteredSpecialties = SPECIALTIES.filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleSpecialties = showAllSpecialties 
    ? filteredSpecialties 
    : filteredSpecialties.filter(s => s.visible);

  const availableArtisans = mockArtisans.filter(a => a.isAvailable);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.greetingSection, { paddingTop: insets.top + DesignTokens.spacing[4] }]}>
          <View style={styles.greetingContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTitle}>Bonjour, {user?.name || 'Utilisateur'}</Text>
              <Text style={styles.greetingSubtitle}>{availableArtisans.length} artisans disponibles près de vous</Text>
            </View>
            <TouchableOpacity style={styles.avatarButtonSmall}>
              <Image
                source={{ uri: user?.photo || 'https://i.pravatar.cc/150' }}
                style={styles.avatarSmall}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchSectionFixed}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une spécialité..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Artisans disponibles</Text>
          {availableArtisans.map((artisan, index) => (
            <TouchableOpacity
              key={artisan.id}
              style={[styles.artisanCard, index > 0 && styles.artisanCardWithBorder]}
              onPress={() => router.push(`/request?artisanId=${artisan.id}` as any)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: artisan.photo }} style={styles.artisanPhoto} />
              <View style={styles.artisanInfo}>
                <View style={styles.artisanHeader}>
                  <Text style={styles.artisanName}>{artisan.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={14} color={Colors.warning} fill={Colors.warning} />
                    <Text style={styles.ratingText}>{artisan.rating}</Text>
                  </View>
                </View>
                <Text style={styles.artisanCategory}>{artisan.category}</Text>
                <View style={styles.artisanFooter}>
                  <View style={styles.artisanDetail}>
                    <MapPin size={12} color={Colors.textSecondary} />
                    <Text style={styles.artisanDetailText}>{artisan.interventionRadius} km</Text>
                  </View>
                  <Text style={styles.artisanPrice}>{artisan.hourlyRate}€/h</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View>
          <Text style={[styles.sectionTitle, { marginTop: DesignTokens.spacing[6] }]}>Spécialités</Text>
          <View style={styles.specialtiesGrid}>
            {visibleSpecialties.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                style={styles.specialtyCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/request?category=${specialty.id}` as any)}
                testID={`specialty-${specialty.id}`}
              >
                <View style={[styles.specialtyIcon, { backgroundColor: Colors.pastel.beige }]}>
                  <Text style={styles.specialtyEmoji}>{specialty.emoji}</Text>
                </View>
                <Text style={styles.specialtyLabel} numberOfLines={2}>{specialty.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!showAllSpecialties && filteredSpecialties.length > 10 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllSpecialties(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.showMoreText}>Voir plus</Text>
              <ChevronDown size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {showAllSpecialties && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllSpecialties(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.showMoreText}>Voir moins</Text>
              <ChevronUp size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  greetingSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    backgroundColor: Colors.surface,
    marginBottom: DesignTokens.spacing[4],
  },
  greetingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: DesignTokens.spacing[1],
  },
  greetingSubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: Colors.textSecondary,
  },
  avatarButtonSmall: {
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.borderRadius.full,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchSectionFixed: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: DesignTokens.spacing[4],
    paddingHorizontal: DesignTokens.spacing[6],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...DesignTokens.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: Colors.text,
    marginLeft: DesignTokens.spacing[2],
  },
  specialtiesGrid: {
    paddingHorizontal: DesignTokens.spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing[3],
  },
  specialtyCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  specialtyIcon: {
    width: 52,
    height: 52,
    borderRadius: DesignTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing[2],
  },
  specialtyEmoji: {
    fontSize: 28,
  },
  specialtyLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing[4],
    marginTop: DesignTokens.spacing[4],
    marginHorizontal: DesignTokens.spacing[6],
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...DesignTokens.shadows.sm,
  },
  showMoreText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: Colors.primary,
    marginRight: DesignTokens.spacing[2],
  },
  listSection: {
    marginBottom: DesignTokens.spacing[6],
  },
  artisanCard: {
    flexDirection: 'row',
    paddingVertical: DesignTokens.spacing[4],
    paddingHorizontal: DesignTokens.spacing[6],
  },
  artisanCardWithBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  artisanPhoto: {
    width: 60,
    height: 60,
    borderRadius: DesignTokens.borderRadius.lg,
    marginRight: DesignTokens.spacing[3],
  },
  artisanInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  artisanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing[1],
  },
  artisanName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: Colors.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: Colors.text,
  },
  artisanCategory: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: DesignTokens.spacing[2],
  },
  artisanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  artisanDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artisanDetailText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  artisanPrice: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.primary,
  },
});
