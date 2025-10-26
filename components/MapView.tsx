import { Platform } from 'react-native';

let MapViewModule: any;
let MarkerModule: any;
let ProviderModule: any;

if (Platform.OS === 'web') {
  const webModule = require('./MapView.web');
  MapViewModule = webModule.MapView;
  MarkerModule = webModule.Marker;
  ProviderModule = webModule.PROVIDER_GOOGLE;
} else {
  const nativeModule = require('./MapView.native');
  MapViewModule = nativeModule.MapView;
  MarkerModule = nativeModule.Marker;
  ProviderModule = nativeModule.PROVIDER_GOOGLE;
}

export const MapView = MapViewModule;
export const Marker = MarkerModule;
export const PROVIDER_GOOGLE = ProviderModule;
