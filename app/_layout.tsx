import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { MissionContext } from '@/contexts/MissionContext';
import { PaymentContext } from '@/contexts/PaymentContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { BusinessAnalyticsContext as BusinessAnalyticsProvider } from '@/contexts/BusinessAnalyticsContext';
import { MarketingContext as MarketingProvider } from '@/contexts/MarketingContext';
import { CRMContext as CRMProvider } from '@/contexts/CRMContext';
import { MonetizationProvider } from '@/contexts/MonetizationContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { AutomationProvider } from '@/contexts/AutomationContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StripeProvider } from '@/components/StripeProvider';
import { trpc, trpcClient } from '@/lib/trpc';
import { cleanStorage } from '@/utils/cleanStorage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

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
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';

  useEffect(() => {
    console.log('[STRIPE] Publishable key loaded:', publishableKey ? 'Yes' : 'No');
    
    // Nettoie le storage au démarrage pour éviter les erreurs JSON Parse
    cleanStorage().catch(err => {
      console.error('[STORAGE] Failed to clean storage on startup:', err);
    });
  }, [publishableKey]);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={publishableKey}>
            <AnalyticsProvider>
              <AuthContext>
                <NotificationProvider>
                  <MissionContext>
                      <PaymentContext>
                        <ChatProvider>
                          <BusinessAnalyticsProvider>
                            <MarketingProvider>
                              <CRMProvider>
                                <MonetizationProvider>
                                  <LocalizationProvider>
                                    <AutomationProvider>
                                      <BrandingProvider>
                                        <RootLayoutNav />
                                      </BrandingProvider>
                                    </AutomationProvider>
                                  </LocalizationProvider>
                                </MonetizationProvider>
                              </CRMProvider>
                            </MarketingProvider>
                          </BusinessAnalyticsProvider>
                        </ChatProvider>
                      </PaymentContext>
                    </MissionContext>
                </NotificationProvider>
              </AuthContext>
            </AnalyticsProvider>
          </StripeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
