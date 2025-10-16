import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { Check, Crown, ArrowRight, X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import type { SubscriptionTier } from "@/types";

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  commission: number;
  features: string[];
  badge: string;
  color: string;
}

const plans: SubscriptionPlan[] = [
  {
    tier: "free",
    name: "Gratuit",
    price: 0,
    commission: 15,
    features: [
      "Accès de base",
      "5 missions/mois",
      "Support standard",
      "Commission 15%",
    ],
    badge: "Basique",
    color: "#6B7280",
  },
  {
    tier: "pro",
    name: "Pro",
    price: 29.99,
    commission: 10,
    features: [
      "Visibilité prioritaire",
      "Missions illimitées",
      "Commission réduite 10%",
      "Badge Pro",
      "Support prioritaire",
      "Statistiques avancées",
    ],
    badge: "Populaire",
    color: "#3B82F6",
  },
  {
    tier: "premium",
    name: "Premium",
    price: 79.99,
    commission: 5,
    features: [
      "Visibilité maximale",
      "Missions illimitées",
      "Commission réduite 5%",
      "Badge Premium",
      "Support dédié 24/7",
      "Statistiques avancées",
      "Formation mensuelle",
      "Publicité sponsorisée",
    ],
    badge: "Meilleure offre",
    color: "#F59E0B",
  },
];

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);

  const subscriptionQuery = trpc.subscription.get.useQuery({ artisanId: "art-1" });
  const createMutation = trpc.subscription.create.useMutation();
  const upgradeMutation = trpc.subscription.upgrade.useMutation();
  const cancelMutation = trpc.subscription.cancel.useMutation();

  const currentSubscription = subscriptionQuery.data?.subscription;

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === "free") {
      Alert.alert("Info", "Vous êtes déjà sur le plan gratuit");
      return;
    }

    if (currentSubscription?.tier === tier) {
      Alert.alert("Info", `Vous êtes déjà abonné au plan ${tier}`);
      return;
    }

    try {
      if (currentSubscription && currentSubscription.tier !== "free") {
        await upgradeMutation.mutateAsync({
          subscriptionId: currentSubscription.id,
          newTier: tier as "pro" | "premium",
          paymentMethodId: "pm_mock",
        });
        Alert.alert("Succès", `Abonnement mis à niveau vers ${tier}!`);
      } else {
        await createMutation.mutateAsync({
          artisanId: "art-1",
          tier,
          paymentMethodId: "pm_mock",
        });
        Alert.alert("Succès", `Abonnement ${tier} activé!`);
      }
      subscriptionQuery.refetch();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de souscrire à cet abonnement");
      console.error(error);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription || currentSubscription.tier === "free") {
      return;
    }

    Alert.alert(
      "Annuler l'abonnement",
      "Êtes-vous sûr de vouloir annuler votre abonnement ? Vous garderez l'accès jusqu'à la fin de la période payée.",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync({
                subscriptionId: currentSubscription.id,
              });
              Alert.alert("Annulé", "Votre abonnement a été annulé");
              subscriptionQuery.refetch();
            } catch (error) {
              Alert.alert("Erreur", "Impossible d'annuler l'abonnement");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  if (subscriptionQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Abonnements" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Abonnements",
          headerRight: () =>
            currentSubscription && currentSubscription.tier !== "free" ? (
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#EF4444" />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Crown size={40} color="#F59E0B" />
          <Text style={styles.title}>Passez au niveau supérieur</Text>
          <Text style={styles.subtitle}>
            Débloquez plus de missions et réduisez vos commissions
          </Text>
        </View>

        {currentSubscription && (
          <View style={styles.currentPlanCard}>
            <Text style={styles.currentPlanLabel}>Votre plan actuel</Text>
            <Text style={styles.currentPlanName}>
              {plans.find((p) => p.tier === currentSubscription.tier)?.name || "Gratuit"}
            </Text>
            {subscriptionQuery.data?.usage && (
              <Text style={styles.usage}>
                {subscriptionQuery.data.usage.missionsThisMonth} missions ce mois
                {subscriptionQuery.data.usage.missionsLimit &&
                  ` / ${subscriptionQuery.data.usage.missionsLimit}`}
              </Text>
            )}
          </View>
        )}

        {plans.map((plan) => {
          const isCurrent = currentSubscription?.tier === plan.tier;
          const isSelected = selectedPlan === plan.tier;

          return (
            <TouchableOpacity
              key={plan.tier}
              style={[
                styles.planCard,
                isCurrent && styles.currentCard,
                isSelected && styles.selectedCard,
              ]}
              onPress={() => setSelectedPlan(plan.tier)}
              activeOpacity={0.7}
              testID={`subscription-plan-${plan.tier}`}
            >
              {plan.badge && (
                <View style={[styles.badge, { backgroundColor: plan.color }]}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planTitleRow}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {isCurrent && (
                    <View style={styles.activeTag}>
                      <Text style={styles.activeText}>Actif</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                  </Text>
                  {plan.price > 0 && <Text style={styles.period}>/mois</Text>}
                </View>
                <Text style={styles.commission}>Commission: {plan.commission}%</Text>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.feature}>
                    <Check size={20} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {!isCurrent && (
                <TouchableOpacity
                  style={[styles.subscribeButton, { backgroundColor: plan.color }]}
                  onPress={() => handleSubscribe(plan.tier)}
                  disabled={createMutation.isPending || upgradeMutation.isPending}
                >
                  {createMutation.isPending || upgradeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.subscribeButtonText}>
                        {currentSubscription && currentSubscription.tier !== "free"
                          ? "Changer de plan"
                          : "S'abonner"}
                      </Text>
                      <ArrowRight size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Les abonnements sont sans engagement et peuvent être annulés à tout moment
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  currentPlanCard: {
    backgroundColor: "#EEF2FF",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  currentPlanLabel: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
  },
  usage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  currentCard: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F9FF",
  },
  selectedCard: {
    borderColor: "#3B82F6",
  },
  badge: {
    position: "absolute",
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
  },
  activeTag: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  activeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#111827",
  },
  period: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 4,
  },
  commission: {
    fontSize: 14,
    color: "#6B7280",
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
  subscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
    marginRight: 8,
  },
  footer: {
    padding: 20,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
