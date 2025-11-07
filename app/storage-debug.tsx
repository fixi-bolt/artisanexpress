import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';
import StorageDebug from '@/components/StorageDebug';

export default function StorageDebugScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen 
        options={{
          title: 'Storage Debug',
          presentation: 'modal',
        }}
      />
      <StorageDebug />
    </SafeAreaView>
  );
}
