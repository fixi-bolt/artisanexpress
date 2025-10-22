import { Tabs, useRouter, useSegments, usePathname } from "expo-router";
import { Briefcase, DollarSign, User } from "lucide-react-native";
import React, { useEffect } from "react";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function ArtisanTabLayout() {
  const { user, isArtisan } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    try {
      console.log("[ArtisanLayout] path=", pathname, "segments=", JSON.stringify(segments));
      if (isArtisan) {
        const category = (user as any)?.category as string | undefined;
        const needsSpecialty = !category || category === 'Non spécifié';
        const isOnSpecialty = pathname?.includes('/(artisan)/specialty');
        if (needsSpecialty && !isOnSpecialty) {
          console.log("[ArtisanLayout] Redirecting to specialty selection");
          router.replace('/(artisan)/specialty' as any);
        }
      }
    } catch (e) {
      console.log("[ArtisanLayout] guard error", e);
    }
  }, [isArtisan, user, pathname, router, segments]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Missions",
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Revenus",
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="siret-verification"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="specialty"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="heatmap"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
