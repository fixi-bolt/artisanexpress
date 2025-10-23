import React from 'react';
import MapViewNative, { Marker as MarkerNative, PROVIDER_GOOGLE } from 'react-native-maps';

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
  return (
    <MapViewNative
      style={props.style}
      provider={PROVIDER_GOOGLE}
      initialRegion={props.initialRegion}
      showsUserLocation={props.showsUserLocation}
      showsMyLocationButton={props.showsMyLocationButton}
      showsCompass={props.showsCompass}
      testID={props.testID}
    >
      {props.children}
    </MapViewNative>
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
  return (
    <MarkerNative
      coordinate={props.coordinate}
      title={props.title}
      description={props.description}
    />
  );
}

export { PROVIDER_GOOGLE };
