import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { BusinessAnalyticsContext, useBusinessAnalytics, AnalyticsPeriod } from '@/contexts/BusinessAnalyticsContext';
import { StatCard } from '@/components/charts/StatCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  RefreshCw,
  Calendar,
} from 'lucide-react-native';

function AnalyticsContent() {
  const {
    period,
    changePeriod,
    refresh,
    revenueData,
    isLoadingRevenue,
    userMetrics,
    isLoadingUserMetrics,
    conversionFunnel,
    isLoadingConversion,
  } = useBusinessAnalytics();

  const [selectedTab, setSelectedTab] = useState<'revenue' | 'users' | 'conversion'>('revenue');

  const periodOptions: { label: string; value: AnalyticsPeriod }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' },
  ];

  const isLoading = isLoadingRevenue || isLoadingUserMetrics || isLoadingConversion;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Business Analytics',
          headerRight: () => (
            <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
              <RefreshCw size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          {periodOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.periodButton,
                period === option.value && styles.periodButtonActive,
              ]}
              onPress={() => changePeriod(option.value)}
            >
              <Calendar
                size={16}
                color={period === option.value ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.periodButtonText,
                  period === option.value && styles.periodButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {revenueData && (
                <>
                  <StatCard
                    title="Total Revenue"
                    value={`€${revenueData.summary.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    iconColor={colors.success}
                    trend={revenueData.summary.revenueGrowth}
                    trendLabel="vs prev period"
                  />
                  <StatCard
                    title="Commissions"
                    value={`€${revenueData.summary.totalCommissions.toLocaleString()}`}
                    icon={TrendingUp}
                    iconColor={colors.primary}
                    subtitle="Platform earnings"
                  />
                </>
              )}
              {userMetrics && (
                <>
                  <StatCard
                    title="Total Users"
                    value={userMetrics.summary.totalUsers.toLocaleString()}
                    icon={Users}
                    iconColor={colors.info}
                    trend={userMetrics.summary.userGrowth}
                    trendLabel="growth"
                  />
                  <StatCard
                    title="Transactions"
                    value={revenueData?.summary.totalTransactions.toLocaleString() || '0'}
                    icon={ShoppingCart}
                    iconColor={colors.secondary}
                    subtitle={`€${revenueData?.summary.averageTransactionValue.toLocaleString() || 0} avg`}
                  />
                </>
              )}
            </View>

            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'revenue' && styles.tabActive]}
                onPress={() => setSelectedTab('revenue')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'revenue' && styles.tabTextActive,
                  ]}
                >
                  Revenue
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
                onPress={() => setSelectedTab('users')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'users' && styles.tabTextActive,
                  ]}
                >
                  Users
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'conversion' && styles.tabActive]}
                onPress={() => setSelectedTab('conversion')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'conversion' && styles.tabTextActive,
                  ]}
                >
                  Conversion
                </Text>
              </TouchableOpacity>
            </View>

            {selectedTab === 'revenue' && revenueData && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Revenue Over Time</Text>
                <LineChart
                  data={revenueData.revenueData.map((d) => ({
                    date: d.date,
                    value: d.revenue,
                  }))}
                  color={colors.success}
                  height={220}
                />

                <Text style={styles.sectionTitle}>Revenue by Category</Text>
                <BarChart
                  data={revenueData.topCategories.map((cat) => ({
                    label: cat.category,
                    value: Math.round(cat.revenue),
                    color: colors.categories[cat.category as keyof typeof colors.categories],
                  }))}
                  height={200}
                />
              </View>
            )}

            {selectedTab === 'users' && userMetrics && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>User Growth</Text>
                <LineChart
                  data={userMetrics.userData.map((d) => ({
                    date: d.date,
                    value: d.newUsers,
                  }))}
                  color={colors.info}
                  height={220}
                />

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {userMetrics.summary.retentionRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.metricLabel}>Retention Rate</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {userMetrics.summary.averageSessionDuration.toFixed(1)} min
                    </Text>
                    <Text style={styles.metricLabel}>Avg Session</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {userMetrics.summary.churnRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.metricLabel}>Churn Rate</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>User Segments</Text>
                <BarChart
                  data={userMetrics.userSegments.map((seg) => ({
                    label: seg.segment,
                    value: seg.count,
                    color: colors.primary,
                  }))}
                  height={200}
                  horizontal
                />
              </View>
            )}

            {selectedTab === 'conversion' && conversionFunnel && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Conversion Funnel</Text>
                <View style={styles.conversionRate}>
                  <Text style={styles.conversionRateValue}>
                    {conversionFunnel.overallConversionRate}%
                  </Text>
                  <Text style={styles.conversionRateLabel}>Overall Conversion Rate</Text>
                </View>

                <BarChart
                  data={conversionFunnel.funnel.map((stage) => ({
                    label: stage.stage.split(' ')[0],
                    value: stage.count,
                    color: colors.primaryLight,
                  }))}
                  height={200}
                />

                <Text style={styles.sectionTitle}>Drop-off Analysis</Text>
                {conversionFunnel.dropoffAnalysis.map((drop, index) => (
                  <View key={index} style={styles.dropoffCard}>
                    <View style={styles.dropoffHeader}>
                      <Text style={styles.dropoffStage}>
                        {drop.from} → {drop.to}
                      </Text>
                      <Text style={styles.dropoffRate}>{drop.dropoffRate}%</Text>
                    </View>
                    <Text style={styles.dropoffCount}>
                      {drop.dropoff.toLocaleString()} users lost
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AdminAnalyticsScreen() {
  return (
    <BusinessAnalyticsContext>
      <AnalyticsContent />
    </BusinessAnalyticsContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsGrid: {
    paddingHorizontal: 16,
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  chartSection: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  conversionRate: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  conversionRateValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  conversionRateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dropoffCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  dropoffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropoffStage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  dropoffRate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.error,
  },
  dropoffCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
