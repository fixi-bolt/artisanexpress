import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens } from '@/constants/design-tokens';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import Colors from '@/constants/colors';
import { MapView, Marker } from '@/components/MapView';
import { Search, ChevronDown, ChevronUp } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_VISIBLE_HEIGHT = SCREEN_HEIGHT * 0.35;
const OVERLAY_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.88;

const SPECIALTIES = [
  { id: 'plumber', label: 'Plombier', emoji: '🔧', visible: true },
  { id: 'electrician', label: 'Électricien', emoji: '⚡', visible: true },
  { id: 'carpenter', label: 'Menuisier', emoji: '🪚', visible: true },
  { id: 'mason', label: 'Maçon', emoji: '🧱', visible: true },
  { id: 'painter', label: 'Peintre', emoji: '🎨', visible: true },
  { id: 'roofer', label: 'Couvreur', emoji: '🔨', visible: true },
  { id: 'locksmith', label: 'Serrurier', emoji: '🚪', visible: true },
  { id: 'hvac', label: 'Chauffagiste', emoji: '❄️', visible: true },
  { id: 'glazier', label: 'Vitrier', emoji: '🪟', visible: true },
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
  { id: 'welder', label: 'Soudeur', emoji: '🧑\u200d🏭', visible: false },
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const overlayHeight = useRef(new Animated.Value(MAP_VISIBLE_HEIGHT)).current;
  const mapOpacity = useRef(new Animated.Value(1)).current;

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

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 20) {
          Animated.parallel([
            Animated.timing(overlayHeight, {
              toValue: OVERLAY_EXPANDED_HEIGHT,
              duration: 220,
              useNativeDriver: false,
            }),
            Animated.timing(mapOpacity, {
              toValue: 0.2,
              duration: 220,
              useNativeDriver: false,
            }),
          ]).start();
        } else if (offsetY <= 0) {
          Animated.parallel([
            Animated.timing(overlayHeight, {
              toValue: MAP_VISIBLE_HEIGHT,
              duration: 220,
              useNativeDriver: false,
            }),
            Animated.timing(mapOpacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    }
  );

  const filteredSpecialties = SPECIALTIES.filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleSpecialties = showAllSpecialties 
    ? filteredSpecialties 
    : filteredSpecialties.filter(s => s.visible);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mapContainer, { opacity: mapOpacity }]}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 49.0379,
            longitude: 2.0773,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{ latitude: 49.0379, longitude: 2.0773 }}
            title="Votre position"
          />
        </MapView>
      </Animated.View>

      <Animated.View 
        style={[
          styles.overlayContainer,
          { 
            height: overlayHeight,
            paddingTop: insets.top,
          },
        ]}
      >
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

        <View style={styles.content}>
          <View style={styles.handleBar} />

          <Animated.ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Spécialités</Text>
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
          </Animated.ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
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
  handleBar: {
    width: 48,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: DesignTokens.borderRadius.full,
    alignSelf: 'center',
    marginTop: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[2],
  },
  scrollContent: {
    paddingTop: DesignTokens.spacing[4],
  },
  searchSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[4],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: DesignTokens.spacing[4],
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
});
