import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserLocationMap from '@/components/UserLocationMap';

export default function GeoMapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]} testID="geo-map-screen">
      <Stack.Screen options={{ title: 'Carte' }} />
      <UserLocationMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
