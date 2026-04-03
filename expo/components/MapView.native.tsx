import React, { forwardRef } from 'react';
import MapViewNative, { Marker as MarkerNative, Circle as CircleNative, PROVIDER_DEFAULT, MapViewProps as RNMapViewProps } from 'react-native-maps';

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
  pitchEnabled?: boolean;
  zoomControlEnabled?: boolean;
  zoomTapEnabled?: boolean;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  onPanDrag?: RNMapViewProps['onPanDrag'];
  onRegionChangeComplete?: RNMapViewProps['onRegionChangeComplete'];
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
      showsUserLocation={props.showsUserLocation ?? false}
      showsMyLocationButton={props.showsMyLocationButton ?? false}
      showsCompass={props.showsCompass ?? false}
      zoomEnabled={props.zoomEnabled ?? true}
      scrollEnabled={props.scrollEnabled ?? true}
      rotateEnabled={props.rotateEnabled ?? true}
      pitchEnabled={props.pitchEnabled ?? true}
      zoomControlEnabled={props.zoomControlEnabled ?? true}
      zoomTapEnabled={props.zoomTapEnabled ?? true}
      minZoomLevel={props.minZoomLevel}
      maxZoomLevel={props.maxZoomLevel}
      onPanDrag={props.onPanDrag}
      onRegionChangeComplete={props.onRegionChangeComplete}
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

interface CircleProps {
  center: { latitude: number; longitude: number };
  radius: number;
  strokeColor?: string;
  fillColor?: string;
}

export function Circle(props: CircleProps) {
  return (
    <CircleNative
      center={props.center}
      radius={props.radius}
      strokeColor={props.strokeColor}
      fillColor={props.fillColor}
    />
  );
}

export const PROVIDER_GOOGLE = PROVIDER_DEFAULT;
