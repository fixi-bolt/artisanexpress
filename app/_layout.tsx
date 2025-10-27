import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { MissionContext } from '@/contexts/MissionContext';
import { PaymentContext } from '@/contexts/PaymentContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { BusinessAnalyticsContext } from '@/contexts/BusinessAnalyticsContext';
import { MarketingContext } from '@/contexts/MarketingContext';
import { CRMContext } from '@/contexts/CRMContext';
import { MonetizationProvider } from '@/contexts/MonetizationContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { AutomationProvider } from '@/contexts/AutomationContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StripeProvider } from '@/components/StripeProvider';
import { trpc, trpcClient } from '@/lib/trpc';
import { useEffect } from 'react';

const queryClient = new QueryClient();

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
  }, [publishableKey]);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={publishableKey}>
            <AuthContext>
              <NotificationProvider>
                <AnalyticsProvider>
                  <MissionContext>
                    <PaymentContext>
                      <ChatProvider>
                        <BusinessAnalyticsContext>
                          <MarketingContext>
                            <CRMContext>
                              <MonetizationProvider>
                                <LocalizationProvider>
                                  <AutomationProvider>
                                    <BrandingProvider>
                                      <RootLayoutNav />
                                    </BrandingProvider>
                                  </AutomationProvider>
                                </LocalizationProvider>
                              </MonetizationProvider>
                            </CRMContext>
                          </MarketingContext>
                        </BusinessAnalyticsContext>
                      </ChatProvider>
                    </PaymentContext>
                  </MissionContext>
                </AnalyticsProvider>
              </NotificationProvider>
            </AuthContext>
          </StripeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
