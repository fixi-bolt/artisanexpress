import { Platform, View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import React from "react";

let NativeMapView: any = null;
let NativeMarker: any = null;
let NATIVE_PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    NativeMapView = maps.default;
    NativeMarker = maps.Marker;
    NATIVE_PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.log('[MapView] Maps not available on this platform');
  }
}

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
  testID?: string;
  children?: React.ReactNode;
}

export function MapView(props: MapViewProps) {
  if (Platform.OS === 'web') {
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

  if (!NativeMapView) {
    return (
      <View style={[props.style, styles.webMapContainer]}>
        <View style={styles.webMapOverlay}>
          <Text style={styles.webMapText}>Carte non disponible</Text>
        </View>
      </View>
    );
  }

  return (
    <NativeMapView
      style={props.style}
      provider={NATIVE_PROVIDER_GOOGLE}
      initialRegion={props.initialRegion}
      showsUserLocation={props.showsUserLocation}
      showsMyLocationButton={props.showsMyLocationButton}
      showsCompass={props.showsCompass}
      testID={props.testID}
    >
      {props.children}
    </NativeMapView>
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

export function Marker(props: MarkerProps) {
  if (Platform.OS === 'web' || !NativeMarker) {
    return null;
  }

  return (
    <NativeMarker
      coordinate={props.coordinate}
      title={props.title}
      description={props.description}
    />
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    backgroundColor: Colors.primaryLight + '30',
    position: 'relative',
  },
  webMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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

export const PROVIDER_GOOGLE = NATIVE_PROVIDER_GOOGLE;
