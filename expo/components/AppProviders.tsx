import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext as AuthProvider } from '@/contexts/AuthContext';
import { MissionContext as MissionProvider } from '@/contexts/MissionContext';
import { PaymentContext as PaymentProvider } from '@/contexts/PaymentContext';
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
import { StripeProvider } from '@/components/StripeProvider';
import { trpc, trpcClient } from '@/lib/trpc';
import { ReactNode } from 'react';

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

export function AppProviders({ children }: { children: ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={publishableKey}>
          <AnalyticsProvider>
            <AuthProvider>
              <NotificationProvider>
                <LocalizationProvider>
                  <MissionProvider>
                    <PaymentProvider>
                      <ChatProvider>
                        <BusinessAnalyticsProvider>
                          <MarketingProvider>
                            <CRMProvider>
                              <MonetizationProvider>
                                <AutomationProvider>
                                  <BrandingProvider>
                                    {children}
                                  </BrandingProvider>
                                </AutomationProvider>
                              </MonetizationProvider>
                            </CRMProvider>
                          </MarketingProvider>
                        </BusinessAnalyticsProvider>
                      </ChatProvider>
                    </PaymentProvider>
                  </MissionProvider>
                </LocalizationProvider>
              </NotificationProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </StripeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
