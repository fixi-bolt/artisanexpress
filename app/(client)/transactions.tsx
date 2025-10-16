import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Receipt, CreditCard, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePayments } from '@/contexts/PaymentContext';
import { useMissions } from '@/contexts/MissionContext';
import { Transaction } from '@/types';
import EmptyState from '@/components/EmptyState';
import { useEffect, useRef } from 'react';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { getUserTransactions } = usePayments();
  const { missions } = useMissions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const transactions = getUserTransactions();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const getMissionTitle = (missionId: string): string => {
    const mission = missions.find(m => m.id === missionId);
    return mission?.title || 'Mission inconnue';
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'processing':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Payé';
      case 'processing':
        return 'En cours';
      case 'failed':
        return 'Échoué';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  const renderTransaction = (transaction: Transaction) => (
    <TouchableOpacity
      key={transaction.id}
      style={styles.transactionCard}
      activeOpacity={0.7}
    >
      <View style={styles.transactionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
          <Receipt size={24} color={Colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{getMissionTitle(transaction.missionId)}</Text>
          <View style={styles.transactionMeta}>
            <Calendar size={14} color={Colors.textLight} strokeWidth={2} />
            <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={styles.transactionAmount}>
            {transaction.amount.toFixed(2)} €
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {getStatusLabel(transaction.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <CreditCard size={16} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.detailText}>
            {transaction.paymentMethod.type === 'card' 
              ? `•••• ${transaction.paymentMethod.last4}` 
              : 'PayPal'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Transactions',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
        }} 
      />

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucune transaction"
            description="Vos transactions apparaîtront ici une fois que vous aurez payé pour des missions"
            iconColor={Colors.primary}
          />
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Historique</Text>
              <Text style={styles.headerSubtitle}>
                {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
              </Text>
            </View>

            {transactions.map(renderTransaction)}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  transactionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.textLight,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  transactionDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

});
