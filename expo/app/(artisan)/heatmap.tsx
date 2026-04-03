import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { MapPin, TrendingUp, Users, DollarSign } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import type { ArtisanCategory } from "@/types";
import { categories } from "@/mocks/artisans";

export default function HeatmapScreen() {
  const [selectedCategory, setSelectedCategory] = useState<ArtisanCategory | undefined>(
    undefined
  );
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "all">("week");

  const heatmapQuery = trpc.heatmap.getDemandHeatmap.useQuery({
    category: selectedCategory,
    timeRange,
  });

  const densityQuery = trpc.heatmap.getArtisanDensity.useQuery({
    category: selectedCategory,
  });

  const timeRanges = [
    { value: "day" as const, label: "Aujourd'hui" },
    { value: "week" as const, label: "Cette semaine" },
    { value: "month" as const, label: "Ce mois" },
    { value: "all" as const, label: "Tout" },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Carte de la demande" }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MapPin size={32} color="#3B82F6" />
          <Text style={styles.title}>Où se trouvent les opportunités ?</Text>
          <Text style={styles.subtitle}>
            Découvrez les zones avec le plus de demandes
          </Text>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filterLabel}>Période</Text>
          <View style={styles.timeRangeButtons}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.timeRangeButton,
                  timeRange === range.value && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange(range.value)}
              >
                <Text
                  style={[
                    styles.timeRangeButtonText,
                    timeRange === range.value && styles.timeRangeButtonTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: 20 }]}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(undefined)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                Toutes
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {heatmapQuery.isLoading || densityQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <>
            <View style={styles.insightsCard}>
              <Text style={styles.sectionTitle}>📊 Statistiques</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <TrendingUp size={24} color="#3B82F6" />
                  <Text style={styles.statValue}>
                    {heatmapQuery.data?.insights.totalMissions || 0}
                  </Text>
                  <Text style={styles.statLabel}>Missions</Text>
                </View>
                <View style={styles.statItem}>
                  <Users size={24} color="#10B981" />
                  <Text style={styles.statValue}>
                    {densityQuery.data?.analysis.totalArtisans || 0}
                  </Text>
                  <Text style={styles.statLabel}>Artisans actifs</Text>
                </View>
                <View style={styles.statItem}>
                  <DollarSign size={24} color="#F59E0B" />
                  <Text style={styles.statValue}>
                    {heatmapQuery.data?.zones?.[0]?.averagePrice.toFixed(0) || 0}€
                  </Text>
                  <Text style={styles.statLabel}>Prix moyen</Text>
                </View>
              </View>
            </View>

            <View style={styles.zonesSection}>
              <Text style={styles.sectionTitle}>🔥 Zones les plus actives</Text>
              {heatmapQuery.data?.zones.map((zone, index) => (
                <View key={zone.zone} style={styles.zoneCard}>
                  <View style={styles.zoneHeader}>
                    <View style={styles.zoneRank}>
                      <Text style={styles.zoneRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.zoneInfo}>
                      <Text style={styles.zoneName}>{zone.zone}</Text>
                      <Text style={styles.zoneDetails}>
                        {zone.missionCount} missions · {zone.totalRevenue}€ de revenus
                      </Text>
                    </View>
                  </View>
                  <View style={styles.zoneStats}>
                    <View style={styles.zoneStatItem}>
                      <Text style={styles.zoneStatLabel}>Prix moyen</Text>
                      <Text style={styles.zoneStatValue}>{zone.averagePrice}€</Text>
                    </View>
                    <View style={styles.zoneStatItem}>
                      <Text style={styles.zoneStatLabel}>Rayon</Text>
                      <Text style={styles.zoneStatValue}>{zone.radius} km</Text>
                    </View>
                    <View style={styles.zoneStatItem}>
                      <Text style={styles.zoneStatLabel}>Top catégorie</Text>
                      <Text style={styles.zoneStatValue}>
                        {categories.find((c) => c.id === zone.topCategory)?.label ||
                          zone.topCategory}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.recommendationsCard}>
              <Text style={styles.sectionTitle}>💡 Recommandations</Text>
              <Text style={styles.recommendationText}>
                • Les heures de pointe sont entre{" "}
                {heatmapQuery.data?.insights.peakHours.join(" et ")}
              </Text>
              <Text style={styles.recommendationText}>
                • Les catégories en croissance:{" "}
                {heatmapQuery.data?.insights.growingCategories
                  .map((c) => categories.find((cat) => cat.id === c)?.label)
                  .join(", ")}
              </Text>
              <Text style={styles.recommendationText}>
                • Temps de réponse moyen:{" "}
                {heatmapQuery.data?.insights.averageResponseTime} minutes
              </Text>
            </View>
          </>
        )}
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
    paddingVertical: 60,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  timeRangeButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  timeRangeButtonTextActive: {
    color: "#FFFFFF",
  },
  categoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  insightsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  zonesSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  zoneCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  zoneRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  zoneRankText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#3B82F6",
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  zoneDetails: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  zoneStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  zoneStatItem: {
    flex: 1,
  },
  zoneStatLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  zoneStatValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
  },
  recommendationsCard: {
    backgroundColor: "#FFFBEB",
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  recommendationText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 22,
    marginBottom: 8,
  },
});
