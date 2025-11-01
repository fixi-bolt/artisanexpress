import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { categories, mockArtisans } from '@/mocks/artisans';
import { Artisan } from '@/types';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { MapView, Marker } from '@/components/MapView';
import { Star, MapPin, Clock, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const OVERLAY_MIN_HEIGHT = SCREEN_HEIGHT * 0.4;

function getCategoryLabel(id: Artisan['category']): string {
  const found = categories.find(c => c.id === id);
  return found?.label ?? id;
}

export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMission } = useMissions();
  const hasNavigated = useRef(false);
  const [overlayHeight] = useState(new Animated.Value(OVERLAY_MIN_HEIGHT));
  const scrollY = useRef(new Animated.Value(0)).current;

  useScreenTracking('client_home');

  const artisans = useMemo<Artisan[]>(() => mockArtisans.slice(0, 5), []);

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

  const defaultRegion = {
    latitude: 49.0379,
    longitude: 2.0773,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const renderArtisanCard = useCallback(({ item }: { item: Artisan }) => {
    const color = (Colors as any).categories[item.category as keyof (typeof Colors)['categories']];
    return (
      <TouchableOpacity
        style={styles.artisanCard}
        activeOpacity={0.8}
        onPress={() => {
          router.push(`/request?category=${item.category}` as any);
        }}
        testID={`artisan-${item.id}`}
      >
        <Image source={{ uri: item.photo ?? 'https://i.pravatar.cc/150' }} style={styles.artisanAvatar} />
        <View style={styles.artisanBody}>
          <View style={styles.artisanHeader}>
            <Text style={styles.artisanName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: (color ?? Colors.primary) + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: color ?? Colors.primary }]}>{getCategoryLabel(item.category)}</Text>
            </View>
          </View>

          <View style={styles.artisanMeta}>
            <Star size={14} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.artisanMetaText}>{item.rating?.toFixed(1) ?? '—'} ({item.reviewCount ?? 0})</Text>
            <Clock size={14} color={Colors.textLight} />
            <Text style={styles.artisanMetaText}>{item.hourlyRate}€/h</Text>
          </View>

          <View style={styles.artisanMeta}>
            <MapPin size={14} color={Colors.textLight} />
            <Text style={styles.artisanMetaText}>Rayon {item.interventionRadius} km</Text>
            <View style={[styles.availabilityDot, { backgroundColor: item.isAvailable ? Colors.success : Colors.error }]} />
            <Text style={[styles.artisanMetaText, { color: item.isAvailable ? Colors.success : Colors.error }]}>
              {item.isAvailable ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.backgroundMap}
        initialRegion={defaultRegion}
        showsUserLocation={true}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={false}
        testID="background-map"
      >
        {artisans.map((artisan, index) => (
          <Marker
            key={artisan.id}
            coordinate={{
              latitude: defaultRegion.latitude + (Math.random() - 0.5) * 0.02,
              longitude: defaultRegion.longitude + (Math.random() - 0.5) * 0.02,
            }}
            title={artisan.name}
            description={getCategoryLabel(artisan.category)}
          />
        ))}
      </MapView>

      <Animated.View
        style={[
          styles.overlayContainer,
          {
            height: overlayHeight,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.overlayHandle}>
          <View style={styles.handleBar} />
        </View>

        <View style={styles.overlayHeader}>
          <Text style={styles.greeting}>Bonjour, {user?.name || 'Utilisateur'}</Text>
          <Text style={styles.subtitle}>Artisans disponibles près de vous</Text>
        </View>

        <Animated.ScrollView
          style={styles.overlayScroll}
          contentContainerStyle={[styles.overlayScrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.artisansList}>
            {artisans.map((item, index) => (
              <View key={item.id}>
                {renderArtisanCard({ item })}
                {index < artisans.length - 1 && <View style={styles.artisanSeparator} />}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/artisans' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllButtonText}>Voir tous les artisans</Text>
            <ChevronDown size={20} color={AppColors.primary} />
          </TouchableOpacity>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  backgroundMap: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: DesignTokens.borderRadius['2xl'],
    borderTopRightRadius: DesignTokens.borderRadius['2xl'],
    ...DesignTokens.shadows.xl,
    overflow: 'hidden',
  },
  overlayHandle: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing[3],
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.border.default,
    borderRadius: 2,
  },
  overlayHeader: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[4],
  },
  greeting: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
  },
  overlayScroll: {
    flex: 1,
  },
  overlayScrollContent: {
    paddingHorizontal: DesignTokens.spacing[6],
  },
  artisansList: {
    marginBottom: DesignTokens.spacing[4],
  },
  artisanCard: {
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: DesignTokens.spacing[3],
    ...DesignTokens.shadows.sm,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  artisanAvatar: {
    width: 68,
    height: 68,
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: AppColors.background,
  },
  artisanBody: {
    flex: 1,
    marginLeft: DesignTokens.spacing[3],
    justifyContent: 'center',
  },
  artisanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing[2],
  },
  artisanName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.md,
  },
  categoryBadgeText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.bold,
  },
  artisanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[1],
  },
  artisanMetaText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.text.secondary,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  artisanSeparator: {
    height: DesignTokens.spacing[3],
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: AppColors.background,
    borderRadius: DesignTokens.borderRadius.xl,
    gap: DesignTokens.spacing[2],
    ...DesignTokens.shadows.sm,
  },
  viewAllButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.primary,
  },
});
