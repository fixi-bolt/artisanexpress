import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { DollarSign, TrendingUp, CreditCard, User } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import colors from '@/constants/colors';

type FilterType = 'all' | 'completed' | 'pending' | 'failed';

export default function AdminTransactionsScreen() {
  const [filter, setFilter] = useState<FilterType>('all');

  const statsQuery = trpc.admin.getStats.useQuery();

  const transactions = statsQuery.data?.recentTransactions || [];
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
  const totalArtisanPayouts = transactions.reduce((sum, t) => sum + t.artisanPayout, 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Transactions',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
              <DollarSign size={24} color={colors.primary} />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryValue}>{totalRevenue.toFixed(2)}€</Text>
              <Text style={styles.summaryLabel}>Revenus totaux</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B981' + '20' }]}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryValue}>{totalCommissions.toFixed(2)}€</Text>
              <Text style={styles.summaryLabel}>Commissions</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#3B82F6' + '20' }]}>
              <User size={24} color="#3B82F6" />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryValue}>{totalArtisanPayouts.toFixed(2)}€</Text>
              <Text style={styles.summaryLabel}>Paiements artisans</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'completed', 'pending', 'failed'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                filter === f && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {statsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionIcon}>
                    <CreditCard size={20} color={colors.primary} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionId}>Transaction #{transaction.id}</Text>
                    <Text style={styles.transactionMission}>Mission {transaction.missionId}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(transaction.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(transaction.status) }
                    ]}>
                      {getStatusLabel(transaction.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Montant total:</Text>
                    <Text style={styles.detailValue}>{transaction.amount.toFixed(2)}€</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Commission ({transaction.commission}%):</Text>
                    <Text style={[styles.detailValue, { color: colors.success }]}>
                      {transaction.commissionAmount.toFixed(2)}€
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Paiement artisan:</Text>
                    <Text style={styles.detailValue}>{transaction.artisanPayout.toFixed(2)}€</Text>
                  </View>
                </View>

                <View style={styles.transactionFooter}>
                  <View style={styles.participants}>
                    <Text style={styles.participantLabel}>Client: </Text>
                    <Text style={styles.participantValue}>{transaction.clientId}</Text>
                  </View>
                  <View style={styles.participants}>
                    <Text style={styles.participantLabel}>Artisan: </Text>
                    <Text style={styles.participantValue}>{transaction.artisanId}</Text>
                  </View>
                </View>

                <View style={styles.paymentMethod}>
                  <CreditCard size={14} color="#6B7280" />
                  <Text style={styles.paymentMethodText}>
                    •••• {transaction.paymentMethod.last4}
                  </Text>
                </View>

                <Text style={styles.transactionDate}>
                  {new Date(transaction.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}

            {filteredTransactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <DollarSign size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucune transaction trouvée</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

function getFilterLabel(filter: FilterType): string {
  const labels: Record<FilterType, string> = {
    all: 'Toutes',
    completed: 'Complétées',
    pending: 'En attente',
    failed: 'Échouées',
  };
  return labels[filter];
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: '#10B981',
    pending: '#F59E0B',
    processing: '#3B82F6',
    failed: '#EF4444',
    refunded: '#6B7280',
  };
  return colors[status] || '#6B7280';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: 'Complétée',
    pending: 'En attente',
    processing: 'En cours',
    failed: 'Échouée',
    refunded: 'Remboursée',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionMission: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  participantValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 13,
    color: '#6B7280',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
