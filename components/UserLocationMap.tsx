import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MapView, Marker, Circle } from '@/components/MapView';
import { useGeolocation } from '@/hooks/useGeolocation';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { LocateFixed } from 'lucide-react-native';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface UserLocationMapProps {
  initialDeltas?: { latitudeDelta: number; longitudeDelta: number };
  showAccuracy?: boolean;
  accuracyFillColor?: string;
  accuracyStrokeColor?: string;
  testID?: string;
}

export default function UserLocationMap({
  initialDeltas = { latitudeDelta: 0.01, longitudeDelta: 0.01 },
  showAccuracy = true,
  accuracyFillColor = 'rgba(52, 84, 232, 0.12)',
  accuracyStrokeColor = 'rgba(52, 84, 232, 0.4)',
  testID = 'user-location-map',
}: UserLocationMapProps) {
  const mapRef = useRef<any>(null);
  const hasCenteredRef = useRef<boolean>(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const { position, error, isLoading, hasPermission } = useGeolocation({ enabled: true });

  const initialRegion = useMemo<Region | null>(() => {
    if (!position) return null;
    return {
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: initialDeltas.latitudeDelta,
      longitudeDelta: initialDeltas.longitudeDelta,
    };
  }, [position, initialDeltas.latitudeDelta, initialDeltas.longitudeDelta]);

  useEffect(() => {
    if (mapRef.current && initialRegion && !hasCenteredRef.current) {
      try {
        hasCenteredRef.current = true;
        if (mapRef.current.animateToRegion) {
          mapRef.current.animateToRegion(initialRegion, 800);
        }
        setCurrentRegion(initialRegion);
      } catch (e) {
        console.error('[UserLocationMap] Failed to animate to region:', e);
      }
    }
  }, [initialRegion]);

  const handleRecenter = useCallback(() => {
    if (!position || !mapRef.current) return;
    const region: Region = {
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: initialDeltas.latitudeDelta,
      longitudeDelta: initialDeltas.longitudeDelta,
    };
    try {
      mapRef.current?.animateToRegion?.(region, 600);
      setCurrentRegion(region);
    } catch (e) {
      console.error('[UserLocationMap] Recenter failed:', e);
    }
  }, [position, initialDeltas.latitudeDelta, initialDeltas.longitudeDelta]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Localisation…</Text>
      </View>
    );
  }

  if (error || !hasPermission) {
    return (
      <View style={styles.errorContainer} testID={`${testID}-error`}>
        <Text style={styles.errorTitle}>Localisation désactivée</Text>
        <Text style={styles.errorText}>
          Activez l’accès à la localisation pour centrer la carte sur votre position.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion ?? undefined}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        zoomControlEnabled={true}
        zoomTapEnabled={true}
        minZoomLevel={2}
        maxZoomLevel={20}
        onRegionChangeComplete={(reg: any) => {
          if (reg && typeof reg.latitude === 'number' && typeof reg.longitude === 'number') {
            setCurrentRegion({
              latitude: reg.latitude,
              longitude: reg.longitude,
              latitudeDelta: reg.latitudeDelta ?? initialDeltas.latitudeDelta,
              longitudeDelta: reg.longitudeDelta ?? initialDeltas.longitudeDelta,
            });
          }
        }}
        testID={`${testID}-map`}
      >
        {position && (
          <Marker
            coordinate={{ latitude: position.latitude, longitude: position.longitude }}
            title="Vous êtes ici"
          />
        )}
        {showAccuracy && position?.accuracy && Platform.OS !== 'web' && (
          <Circle
            center={{ latitude: position.latitude, longitude: position.longitude }}
            radius={Math.max(10, position.accuracy)}
            strokeColor={accuracyStrokeColor}
            fillColor={accuracyFillColor}
          />
        )}
      </MapView>

      <FloatingActionButton
        icon={LocateFixed}
        onPress={handleRecenter}
        position="bottom-right"
        color={AppColors.accent}
        style={styles.recenterFab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing[2],
  },
  loadingText: {
    marginTop: DesignTokens.spacing[2],
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing[6],
  },
  errorTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    color: AppColors.text.primary,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    marginBottom: DesignTokens.spacing[2],
    textAlign: 'center',
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.secondary,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.fontSize.base * 1.4,
  },
  recenterFab: {
    // Ensures large touch target >= 44px handled by component sizing
  },
});
