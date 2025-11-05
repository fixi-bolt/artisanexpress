import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text, Platform } from 'react-native';
import { MapView, Marker } from '@/components/MapView';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Navigation, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DesignTokens } from '@/constants/design-tokens';
import { Artisan } from '@/types';

interface InteractiveBackgroundMapProps {
  isVisible: boolean;
  artisans: Artisan[];
  onArtisanPress?: (artisan: Artisan) => void;
  progress?: number;
}

export function InteractiveBackgroundMap({
  isVisible,
  artisans,
  onArtisanPress,
  progress = 1,
}: InteractiveBackgroundMapProps) {
  const mapRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  
  const { position, isLoading, hasPermission } = useGeolocation({
    enabled: true,
    updateInterval: 30000,
  });

  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);

  useEffect(() => {
    console.log('[InteractiveBackgroundMap] Visibility changed:', isVisible, 'progress:', progress);
    
    const targetScale = isVisible ? 1 - (1 - progress) * 0.15 : 0.85;
    const targetOpacity = isVisible ? progress * 0.7 + 0.3 : 0.3;
    const targetY = isVisible ? (1 - progress) * -30 : -50;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: targetScale,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: targetOpacity,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
    ]).start();
  }, [isVisible, progress, scaleAnim, opacityAnim, translateYAnim]);

  useEffect(() => {
    if (position && mapRef.current && isVisible) {
      console.log('[InteractiveBackgroundMap] Centering map on user position:', position);
      
      const region = {
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      if (Platform.OS === 'web') {
        if (mapRef.current?.panTo) {
          mapRef.current.panTo({ lat: position.latitude, lng: position.longitude });
        }
      } else {
        if (mapRef.current?.animateToRegion) {
          mapRef.current.animateToRegion(region, 1000);
        }
      }
    }
  }, [position, isVisible]);

  const nearbyArtisans = useMemo(() => {
    if (!position) return artisans;

    return artisans.filter(artisan => {
      if (!artisan.location) return false;
      
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        artisan.location.latitude,
        artisan.location.longitude
      );
      
      return distance <= (artisan.interventionRadius || 30);
    });
  }, [artisans, position]);

  const handleMarkerPress = (artisan: Artisan) => {
    console.log('[InteractiveBackgroundMap] Artisan marker pressed:', artisan.name);
    setSelectedArtisan(artisan);
    onArtisanPress?.(artisan);
  };

  const initialRegion = position
    ? {
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  if (!hasPermission) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <View style={styles.permissionContainer}>
          <Navigation size={48} color={Colors.primary} />
          <Text style={styles.permissionTitle}>Géolocalisation désactivée</Text>
          <Text style={styles.permissionText}>
            Activez la géolocalisation pour voir les artisans à proximité
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (isLoading) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Navigation size={32} color={Colors.primary} />
          <Text style={styles.loadingText}>Localisation en cours...</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        zoomControlEnabled={true}
        minZoomLevel={3}
        maxZoomLevel={20}
        testID="background-map"
      >
        {nearbyArtisans.map((artisan) => {
          if (!artisan.location) return null;
          
          return (
            <Marker
              key={artisan.id}
              coordinate={{
                latitude: artisan.location.latitude,
                longitude: artisan.location.longitude,
              }}
              title={artisan.name}
              description={`${artisan.category} - ${artisan.hourlyRate}€/h`}
            >
              <TouchableOpacity
                style={[
                  styles.markerContainer,
                  selectedArtisan?.id === artisan.id && styles.markerSelected,
                ]}
                onPress={() => handleMarkerPress(artisan)}
                activeOpacity={0.8}
              >
                <View style={styles.markerInner}>
                  <MapPin size={20} color={Colors.surface} fill={Colors.primary} />
                </View>
              </TouchableOpacity>
            </Marker>
          );
        })}
      </MapView>

      {selectedArtisan && (
        <View style={styles.artisanCardOverlay}>
          <View style={styles.artisanCard}>
            <View style={styles.artisanCardHeader}>
              <Text style={styles.artisanName}>{selectedArtisan.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedArtisan(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.artisanCategory}>{selectedArtisan.category}</Text>
            <View style={styles.artisanDetails}>
              <View style={styles.artisanDetail}>
                <Star size={14} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.artisanDetailText}>{selectedArtisan.rating}</Text>
              </View>
              <View style={styles.artisanDetail}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.artisanDetailText}>
                  {selectedArtisan.interventionRadius} km
                </Text>
              </View>
              <Text style={styles.artisanPrice}>{selectedArtisan.hourlyRate}€/h</Text>
            </View>
          </View>
        </View>
      )}


    </Animated.View>
  );
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    zIndex: 0,
    overflow: 'hidden',
    pointerEvents: 'box-none',
  },
  map: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: DesignTokens.spacing[6],
  },
  permissionTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.text,
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[2],
  },
  permissionText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: DesignTokens.spacing[3],
  },
  markerContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.surface,
    ...DesignTokens.shadows.lg,
  },
  markerSelected: {
    backgroundColor: Colors.secondary,
    transform: [{ scale: 1.2 }],
  },
  markerInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  artisanCardOverlay: {
    position: 'absolute',
    bottom: DesignTokens.spacing[4],
    left: DesignTokens.spacing[4],
    right: DesignTokens.spacing[4],
    zIndex: 10,
  },
  artisanCard: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[4],
    ...DesignTokens.shadows.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  artisanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing[1],
  },
  artisanName: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  artisanCategory: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: DesignTokens.spacing[3],
  },
  artisanDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[3],
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
    marginLeft: 'auto' as any,
  },
  statsOverlay: {
    position: 'absolute',
    top: DesignTokens.spacing[4],
    right: DesignTokens.spacing[4],
    zIndex: 5,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing[3],
    ...DesignTokens.shadows.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: Colors.primary,
  },
  statsLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
