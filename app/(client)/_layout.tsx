import { Tabs } from "expo-router";
import { MapPin, Clock, User } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { useLocalization } from "@/contexts/LocalizationContext";

export default function ClientTabLayout() {
  const { t } = useLocalization();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
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
        name="home"
        options={{
          title: t('nav_map'),
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: t('nav_missions'),
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav_profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
