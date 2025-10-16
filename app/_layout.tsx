import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthContext } from '@/contexts/AuthContext';
import { MissionContext } from '@/contexts/MissionContext';
import { PaymentContext } from '@/contexts/PaymentContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { MonetizationProvider } from '@/contexts/MonetizationContext';
import { trpc, trpcClient } from '@/lib/trpc';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { AutomationProvider } from '@/contexts/AutomationContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Retour", headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen name="(artisan)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="admin-users" options={{ headerShown: true, title: "Gestion Utilisateurs" }} />
      <Stack.Screen name="admin-missions" options={{ headerShown: true, title: "Gestion Missions" }} />
      <Stack.Screen name="admin-transactions" options={{ headerShown: true, title: "Transactions" }} />
      <Stack.Screen name="payment" options={{ presentation: "modal" }} />
      <Stack.Screen name="chat" options={{ presentation: "modal", headerShown: true, title: "Chat" }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: true, title: "Paramètres" }} />
      <Stack.Screen name="automation" options={{ headerShown: true, title: "Automatisations" }} />
      <Stack.Screen name="api-docs" options={{ headerShown: true, title: "API Publique" }} />
      <Stack.Screen name="web-portal" options={{ headerShown: true, title: "Portail Web" }} />
      <Stack.Screen name="branding" options={{ headerShown: true, title: "Branding" }} />
      <Stack.Screen name="press-kit" options={{ headerShown: true, title: "Press Kit" }} />
      <Stack.Screen name="investor" options={{ headerShown: true, title: "Investor Overview" }} />
      <Stack.Screen name="(artisan)/subscription" options={{ headerShown: true, title: "Abonnements" }} />
      <Stack.Screen name="(artisan)/heatmap" options={{ headerShown: true, title: "Carte de la demande" }} />
      <Stack.Screen name="(artisan)/wallet" options={{ headerShown: true, title: "Portefeuille" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AnalyticsProvider>
            <AuthContext>
              <NotificationProvider>
                <MissionContext>
                  <PaymentContext>
                    <MonetizationProvider>
                      <ChatProvider>
                        <LocalizationProvider>
                          <AutomationProvider>
                            <RootLayoutNav />
                          </AutomationProvider>
                        </LocalizationProvider>
                      </ChatProvider>
                    </MonetizationProvider>
                  </PaymentContext>
                </MissionContext>
              </NotificationProvider>
            </AuthContext>
          </AnalyticsProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
