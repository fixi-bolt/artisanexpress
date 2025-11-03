import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface MapViewProps {
  style?: any;
  provider?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  onRegionChangeComplete?: (region: any) => void;
  testID?: string;
  children?: React.ReactNode;
}

export function MapView(props: MapViewProps) {
  return (
    <View style={[props.style, styles.webMapContainer]}>
      <View style={styles.webMapOverlay}>
        <Text style={styles.webMapIcon}>🗺️</Text>
        <Text style={styles.webMapText}>Carte interactive</Text>
        <Text style={styles.webMapSubtext}>(Disponible sur mobile)</Text>
      </View>
    </View>
  );
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

export function Marker(_props: MarkerProps) {
  return null;
}

interface CircleProps {
  center: { latitude: number; longitude: number };
  radius: number;
  strokeColor?: string;
  fillColor?: string;
}

export function Circle(_props: CircleProps) {
  return null;
}

export const PROVIDER_GOOGLE = 'google' as const;

const styles = StyleSheet.create({
  webMapContainer: {
    backgroundColor: Colors.primaryLight + '30',
    position: 'relative' as const,
  },
  webMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  webMapIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  webMapText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  webMapSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
});
