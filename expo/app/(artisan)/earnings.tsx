import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, DollarSign, Clock, CheckCircle, Receipt } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions } from '@/contexts/MissionContext';
import { usePayments } from '@/contexts/PaymentContext';

export default function ArtisanEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { missions } = useMissions();
  const { getTotalEarnings, getTotalCommissions, getUserTransactions } = usePayments();
  
  const artisanMissions = missions.filter(m => m.artisanId === user?.id);
  const completedMissions = artisanMissions.filter(m => m.status === 'completed');
  const transactions = getUserTransactions();
  
  const totalEarnings = getTotalEarnings();
  const totalCommissions = getTotalCommissions();
  const totalRevenue = totalEarnings + totalCommissions;

  const todayEarnings = transactions
    .filter(t => {
      const today = new Date();
      const transactionDate = new Date(t.createdAt);
      return transactionDate.toDateString() === today.toDateString();
    })
    .reduce((sum, t) => sum + t.artisanPayout, 0);

  const thisWeekEarnings = transactions
    .filter(t => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= weekAgo;
    })
    .reduce((sum, t) => sum + t.artisanPayout, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Revenus</Text>
        <Text style={styles.headerSubtitle}>
          Vos gains et statistiques
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Revenus nets (après commission)</Text>
          <Text style={styles.totalValue}>{totalEarnings.toFixed(2)}€</Text>
          <View style={styles.totalMeta}>
            <TrendingUp size={16} color={Colors.success} strokeWidth={2} />
            <Text style={styles.totalMetaText}>
              +{thisWeekEarnings.toFixed(0)}€ cette semaine
            </Text>
          </View>
          <View style={styles.totalBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Montant total facturé</Text>
              <Text style={styles.breakdownValue}>{totalRevenue.toFixed(2)}€</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Commission prélevée</Text>
              <Text style={styles.breakdownCommission}>-{totalCommissions.toFixed(2)}€</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.secondary + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondary }]}>
              <DollarSign size={20} color={Colors.surface} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{todayEarnings.toFixed(0)}€</Text>
            <Text style={styles.statLabel}>Aujourd&apos;hui</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary }]}>
              <Clock size={20} color={Colors.surface} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{artisanMissions.length}</Text>
            <Text style={styles.statLabel}>Missions totales</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.success + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success }]}>
              <CheckCircle size={20} color={Colors.surface} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{completedMissions.length}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.info + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.info }]}>
              <TrendingUp size={20} color={Colors.surface} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>
              {completedMissions.length > 0 
                ? (totalEarnings / completedMissions.length).toFixed(0) 
                : 0}€
            </Text>
            <Text style={styles.statLabel}>Moyenne/mission</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyText}>
                Vos revenus apparaîtront ici après vos premières missions payées
              </Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((transaction) => {
              const mission = missions.find(m => m.id === transaction.missionId);

              return (
                <View key={transaction.id} style={styles.earningCard}>
                  <View style={styles.transactionIcon}>
                    <Receipt size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.earningLeft}>
                    <Text style={styles.earningTitle}>{mission?.title || 'Mission'}</Text>
                    <Text style={styles.earningDate}>
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <View style={styles.commissionDetail}>
                      <Text style={styles.commissionDetailText}>
                        Montant: {transaction.amount.toFixed(2)}€ • Commission ({(transaction.commission * 100).toFixed(0)}%): -{transaction.commissionAmount.toFixed(2)}€
                      </Text>
                    </View>
                  </View>
                  <View style={styles.earningRight}>
                    <Text style={styles.earningAmount}>+{transaction.artisanPayout.toFixed(2)}€</Text>
                    <View style={[styles.statusBadge, { backgroundColor: Colors.success + '20' }]}>
                      <Text style={[styles.statusText, { color: Colors.success }]}>Payé</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Comment sont calculés vos revenus ?</Text>
          <Text style={styles.infoText}>
            • La plateforme prélève une commission de 10-15% selon le type d&apos;intervention{'\n'}
            • Vous recevez le reste directement sur votre compte{'\n'}
            • Les paiements sont traités sous 48h après chaque mission
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  totalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  totalBreakdown: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  breakdownCommission: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  totalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalMetaText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    margin: 6,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  earningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningLeft: {
    flex: 1,
  },
  earningTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  earningDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  earningRight: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.success,
    marginBottom: 6,
  },
  commissionDetail: {
    marginTop: 4,
  },
  commissionDetailText: {
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.info + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
