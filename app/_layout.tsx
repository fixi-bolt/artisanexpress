import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProviders } from '@/components/AppProviders';
import { cleanStorage } from '@/utils/cleanStorage';

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="request" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="payment-stripe" />
      <Stack.Screen name="rate" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="(client)" />
      <Stack.Screen name="(artisan)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="admin-users" />
      <Stack.Screen name="admin-missions" />
      <Stack.Screen name="admin-transactions" />
      <Stack.Screen name="admin-analytics" />
      <Stack.Screen name="admin-marketing" />
      <Stack.Screen name="admin-crm" />
      <Stack.Screen name="admin-finance" />
      <Stack.Screen name="ai-assistant" />
      <Stack.Screen name="support" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="automation" />
      <Stack.Screen name="api-docs" />
      <Stack.Screen name="web-portal" />
      <Stack.Screen name="branding" />
      <Stack.Screen name="investor" />
      <Stack.Screen name="press-kit" />
      <Stack.Screen name="mission-details" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    cleanStorage().catch(err => {
      console.error('[STORAGE] Failed to clean storage on startup:', err);
    });
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <RootLayoutNav />
      </AppProviders>
    </ErrorBoundary>
  );
}
