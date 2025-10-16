import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function AdminFinanceScreen() {
  const q = trpc.monetization.finance.getDashboard.useQuery();
  const series = useMemo(() => q.data?.last30Days ?? [], [q.data?.last30Days]);

  return (
    <View style={styles.container} testID="admin-finance-screen">
      <Stack.Screen options={{ title: 'Finance', headerShown: true }} />
      {q.isLoading ? (
        <Text style={styles.loading}>Chargement...</Text>
      ) : q.error ? (
        <Text style={styles.loading}>Erreur de chargement</Text>
      ) : (
        <View style={styles.content}>
          <View style={styles.row}>
            <Stat title="MRR" value={`€${q.data?.mrr}`} />
            <Stat title="ARR" value={`€${q.data?.arr}`} />
          </View>
          <View style={styles.row}>
            <Stat title="Premium" value={`${q.data?.premiumClients}`} />
            <Stat title="Marge nette" value={`${Math.round((q.data?.netMargin ?? 0) * 100)}%`} />
          </View>
          <Text style={styles.section}>Revenus 30j</Text>
          <FlatList
            data={series}
            keyExtractor={(i) => String(i.day)}
            horizontal
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <View style={styles.bar}>
                <View style={[styles.barFill, { height: Math.max(8, item.revenue), backgroundColor: Colors.primary }]} />
                <Text style={styles.barLabel}>{item.revenue}€</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { padding: 16, color: Colors.textSecondary },
  content: { padding: 16, gap: 12 as const },
  row: { flexDirection: 'row', gap: 12 as const },
  stat: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16 },
  statTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' as const },
  statValue: { color: Colors.text, fontSize: 18, fontWeight: '800' as const, marginTop: 6 },
  section: { marginTop: 8, marginBottom: 4, color: Colors.text, fontWeight: '800' as const },
  bar: { alignItems: 'center', width: 40 },
  barFill: { width: 24, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
});
