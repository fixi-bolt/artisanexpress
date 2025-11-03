import { Platform } from 'react-native';

let MapViewModule: any;
let MarkerModule: any;
let CircleModule: any;
let ProviderModule: any;

if (Platform.OS === 'web') {
  const webModule = require('./MapView.web');
  MapViewModule = webModule.MapView;
  MarkerModule = webModule.Marker;
  CircleModule = webModule.Circle;
  ProviderModule = webModule.PROVIDER_GOOGLE;
} else {
  const nativeModule = require('./MapView.native');
  MapViewModule = nativeModule.MapView;
  MarkerModule = nativeModule.Marker;
  CircleModule = nativeModule.Circle;
  ProviderModule = nativeModule.PROVIDER_GOOGLE;
}

export const MapView = MapViewModule;
export const Marker = MarkerModule;
export const Circle = CircleModule;
export const PROVIDER_GOOGLE = ProviderModule;
