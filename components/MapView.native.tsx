import React, { forwardRef } from 'react';
import MapViewNative, { Marker as MarkerNative, PROVIDER_DEFAULT, MapViewProps as RNMapViewProps } from 'react-native-maps';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  style?: any;
  provider?: any;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  onPanDrag?: RNMapViewProps['onPanDrag'];
  testID?: string;
  children?: React.ReactNode;
}

export const MapView = forwardRef<MapViewNative, MapViewProps>(function MapView(
  props,
  ref
) {
  return (
    <MapViewNative
      ref={ref}
      style={props.style}
      provider={PROVIDER_DEFAULT}
      initialRegion={props.initialRegion}
      showsUserLocation={props.showsUserLocation}
      showsMyLocationButton={props.showsMyLocationButton}
      showsCompass={props.showsCompass}
      zoomEnabled={props.zoomEnabled}
      scrollEnabled={props.scrollEnabled}
      rotateEnabled={props.rotateEnabled}
      onPanDrag={props.onPanDrag}
      testID={props.testID}
    >
      {props.children}
    </MapViewNative>
  );
});

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Marker(props: MarkerProps) {
  return (
    <MarkerNative
      coordinate={props.coordinate}
      title={props.title}
      description={props.description}
    >
      {props.children}
    </MarkerNative>
  );
}

export const PROVIDER_GOOGLE = PROVIDER_DEFAULT;
