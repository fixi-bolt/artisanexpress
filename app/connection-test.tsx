import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ConnectionTest } from '@/components/ConnectionTest';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConnectionTestScreen() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Test de connexion',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <View style={styles.background}>
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <ConnectionTest />
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
});
