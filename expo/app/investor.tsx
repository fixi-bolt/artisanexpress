import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { BusinessAnalyticsContext, useBusinessAnalytics } from '@/contexts/BusinessAnalyticsContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useBranding, BrandingProvider } from '@/contexts/BrandingContext';
import { ExternalLink, LineChart as LineIcon, FileText, BarChart3, Newspaper } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function InvestorContent() {
  const { branding } = useBranding();
  const { revenueData, userMetrics, conversionFunnel } = useBusinessAnalytics();
  const insets = useSafeAreaInsets();

  const kpis = useMemo(() => {
    return [
      {
        label: 'MRR (est.)',
        value: revenueData ? `€${Math.round(revenueData.summary.totalRevenue / 12).toLocaleString()}` : '—',
      },
      {
        label: 'Active users',
        value: userMetrics ? userMetrics.summary.totalUsers.toLocaleString() : '—',
      },
      {
        label: 'Retention',
        value: userMetrics ? `${userMetrics.summary.retentionRate.toFixed(1)}%` : '—',
      },
      {
        label: 'Conv. globale',
        value: conversionFunnel ? `${conversionFunnel.overallConversionRate}%` : '—',
      },
    ];
  }, [revenueData, userMetrics, conversionFunnel]);

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: true, title: 'Investor Overview' }} />

      <View style={[styles.hero, { borderColor: branding.primaryColor }]}> 
        <Text style={[styles.title, { color: branding.primaryColor }]}>{branding.appName}</Text>
        <Text style={styles.subtitle}>{branding.tagline}</Text>
      </View>

      <View style={styles.kpiRow}>
        {kpis.map((k) => (
          <View key={k.label} style={styles.kpiCard} testID={`kpi-${k.label}`}>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <Text style={styles.kpiValue}>{k.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, { backgroundColor: branding.primaryColor }]} onPress={() => open('https://www.notion.so/your-pitch-deck')}>
          <FileText size={16} color="#fff" />
          <Text style={styles.actionText}>Pitch Deck</Text>
          <ExternalLink size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { backgroundColor: branding.secondaryColor }]} onPress={() => open('https://www.figma.com/file/placeholder') }>
          <BarChart3 size={16} color="#fff" />
          <Text style={styles.actionText}>Metrics Room</Text>
          <ExternalLink size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { backgroundColor: branding.accentColor }]} onPress={() => open('https://youtu.be/dQw4w9WgXcQ')}>
          <LineIcon size={16} color="#fff" />
          <Text style={styles.actionText}>Video Demo</Text>
          <ExternalLink size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { backgroundColor: branding.primaryColor }]} onPress={() => Linking.openURL('/press-kit')}>
          <Newspaper size={16} color="#fff" />
          <Text style={styles.actionText}>Press Kit</Text>
          <ExternalLink size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Contact: founders@artisannow.com • Data refreshed live from tRPC</Text>
      </View>
    </ScrollView>
  );
}

export default function InvestorScreen() {
  return (
    <ErrorBoundary>
      <BrandingProvider>
        <BusinessAnalyticsContext>
          <InvestorContent />
        </BusinessAnalyticsContext>
      </BrandingProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: colors.surface, margin: 16, borderRadius: 16, padding: 20, borderWidth: 2 },
  title: { fontSize: 22, fontWeight: '800' as const },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  kpiCard: { flexBasis: '47%', backgroundColor: colors.surface, padding: 16, borderRadius: 12 },
  kpiLabel: { fontSize: 12, color: colors.textSecondary },
  kpiValue: { fontSize: 18, fontWeight: '700' as const, color: colors.text, marginTop: 4 },
  actions: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12 },
  actionText: { color: '#fff', fontWeight: '700' as const },
  footer: { paddingHorizontal: 16, marginTop: 16 },
  footerText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
