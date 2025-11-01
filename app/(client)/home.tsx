import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, NativeScrollEvent, NativeSyntheticEvent, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, MapPin, Star } from 'lucide-react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { categories, mockArtisans } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapView, Marker } from '@/components/MapView';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCROLL_THRESHOLD = 80;
const ANIMATION_DURATION = 280;
const COLLAPSED_LIST_HEIGHT = SCREEN_HEIGHT * 0.4;

export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMission } = useMissions();
  const hasNavigated = useRef(false);
  const [listVisible, setListVisible] = useState<boolean>(false);
  const [nearbyArtisans, setNearbyArtisans] = useState<any[]>([]);
  const listTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastScrollY = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapOpacity = useRef(new Animated.Value(1)).current;
  
  const loadNearbyArtisans = useCallback(async (lat: number, lng: number) => {
    try {
      const artisansWithDistance = mockArtisans
        .filter(a => a.isAvailable)
        .slice(0, 8)
        .map((a, i) => ({
          ...a,
          distance: (Math.random() * 5 + 0.5).toFixed(1),
          eta: `${Math.floor(Math.random() * 10 + 3)} min`,
        }));
      
      setNearbyArtisans(artisansWithDistance);
      console.log('📍 Loaded nearby artisans:', artisansWithDistance.length);
    } catch (error) {
      console.error('❌ Failed to load nearby artisans:', error);
    }
  }, []);

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
          
          loadNearbyArtisans(pos.latitude, pos.longitude);
        } catch (error) {
          console.error('❌ Failed to save location:', error);
        }
      }
    },
  });

  useEffect(() => {
    if (position) {
      console.log('Position updated:', position);
      loadNearbyArtisans(position.latitude, position.longitude);
    }
  }, [position, loadNearbyArtisans]);
  
  useScreenTracking('client_home');

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

  const showArtisansList = useCallback(() => {
    setListVisible(true);
    Animated.parallel([
      Animated.spring(listTranslateY, {
        toValue: SCREEN_HEIGHT - COLLAPSED_LIST_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.timing(mapOpacity, {
        toValue: 0.3,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [listTranslateY, mapOpacity]);

  const hideArtisansList = useCallback(() => {
    setListVisible(false);
    Animated.parallel([
      Animated.spring(listTranslateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [listTranslateY, mapOpacity]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    lastScrollY.current = currentScrollY;

    if (currentScrollY > SCROLL_THRESHOLD && !listVisible) {
      showArtisansList();
    }
  }, [listVisible, showArtisansList]);



  return (
    <View style={styles.container}>
      {position && (
        <Animated.View style={[styles.mapBackground, { opacity: mapOpacity }]}>
          <MapView
            style={styles.mapView}
            initialRegion={{
              latitude: position.latitude,
              longitude: position.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            scrollEnabled={!listVisible}
            zoomEnabled={!listVisible}
            rotateEnabled={!listVisible}
            testID="home-map-background"
          >
            <Marker
              coordinate={{
                latitude: position.latitude,
                longitude: position.longitude,
              }}
              title="Votre position"
            />
            {nearbyArtisans.slice(0, 5).map((artisan, index) => (
              <Marker
                key={artisan.id}
                coordinate={{
                  latitude: position.latitude + (Math.random() - 0.5) * 0.01,
                  longitude: position.longitude + (Math.random() - 0.5) * 0.01,
                }}
                title={artisan.name}
              />
            ))}
          </MapView>
        </Animated.View>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(client)/profile' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'J')[0].toUpperCase()}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.searchBarCompact}>
          <Search size={20} color={AppColors.text.secondary} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Où allez-vous ?</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.artisansListContainer,
          {
            transform: [{ translateY: listTranslateY }],
          },
        ]}
      >
        <View style={styles.listHandle}>
          <View style={styles.handleBar} />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {nearbyArtisans.length} artisans disponibles près de vous
          </Text>
          <TouchableOpacity onPress={hideArtisansList} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronDown size={24} color={AppColors.text.secondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.listScrollView}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {nearbyArtisans.map((artisan) => (
            <TouchableOpacity
              key={artisan.id}
              style={styles.artisanCard}
              onPress={() => router.push(`/request?category=${artisan.category}` as any)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: artisan.photo || 'https://i.pravatar.cc/150' }}
                style={styles.artisanPhoto}
              />
              <View style={styles.artisanInfo}>
                <View style={styles.artisanRow}>
                  <Text style={styles.artisanName}>{artisan.name}</Text>
                  <View style={styles.artisanRating}>
                    <Star size={14} color={AppColors.warning} fill={AppColors.warning} strokeWidth={2} />
                    <Text style={styles.ratingText}>{artisan.rating?.toFixed(1) || '5.0'}</Text>
                  </View>
                </View>
                <Text style={styles.artisanCategory}>
                  {categories.find(c => c.id === artisan.category)?.label || artisan.category}
                </Text>
                <View style={styles.artisanMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={AppColors.text.secondary} strokeWidth={2} />
                    <Text style={styles.metaText}>{artisan.distance} km</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <Text style={styles.etaText}>{artisan.eta}</Text>
                </View>
              </View>
              <View style={styles.artisanPrice}>
                <Text style={styles.priceText}>{artisan.hourlyRate}€</Text>
                <Text style={styles.priceLabel}>/h</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(client)/artisans' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>Voir tous les artisans</Text>
            <ChevronDown size={20} color={AppColors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>


    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  mapView: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[3],
    zIndex: 100,
  },
  avatarButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  avatarText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.primary,
  },
  searchBarCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  artisansListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: DesignTokens.borderRadius['2xl'],
    borderTopRightRadius: DesignTokens.borderRadius['2xl'],
    ...DesignTokens.shadows.xl,
    zIndex: 50,
  },
  listHandle: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing[3],
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.border.default,
    borderRadius: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.light,
  },
  listTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.primary,
    flex: 1,
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    padding: DesignTokens.spacing[4],
    paddingBottom: 120,
  },
  artisanCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[3],
    alignItems: 'center',
    ...DesignTokens.shadows.sm,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  artisanPhoto: {
    width: 64,
    height: 64,
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: AppColors.background,
  },
  artisanInfo: {
    flex: 1,
    marginLeft: DesignTokens.spacing[3],
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing[1],
  },
  artisanName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.primary,
    flex: 1,
  },
  artisanRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[1],
  },
  ratingText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.text.primary,
  },
  artisanCategory: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
  },
  artisanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[1],
  },
  metaText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: AppColors.border.light,
  },
  etaText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.primary,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  artisanPrice: {
    alignItems: 'flex-end',
    marginLeft: DesignTokens.spacing[2],
  },
  priceText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    color: AppColors.text.primary,
  },
  priceLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.text.secondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingVertical: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[2],
    borderWidth: 2,
    borderColor: AppColors.primary + '30',
  },
  viewAllText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.primary,
  },
});
