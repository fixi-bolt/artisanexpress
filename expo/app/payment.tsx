import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, DollarSign, CheckCircle, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePayments } from '@/contexts/PaymentContext';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethod } from '@/types';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const missionId = params.missionId as string;

  const { user } = useAuth();
  const { missions } = useMissions();
  const { calculateCommission, processPayment, processingPayment } = usePayments();

  const mission = missions.find(m => m.id === missionId);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const mockPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', type: 'card', last4: '4242', isDefault: true },
    { id: 'pm2', type: 'card', last4: '5555', isDefault: false },
    { id: 'pm3', type: 'paypal', isDefault: false },
  ];

  if (!mission || !mission.finalPrice) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Paiement', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mission introuvable</Text>
        </View>
      </View>
    );
  }

  const amount = mission.finalPrice;
  const { commission, commissionAmount, artisanPayout } = calculateCommission(amount);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un moyen de paiement');
      return;
    }

    if (!mission.artisanId || !user?.id) {
      Alert.alert('Erreur', 'Informations de mission incomplètes');
      return;
    }

    try {
      const result = await processPayment(
        mission.id,
        `pi_${Date.now()}`,
        selectedPaymentMethod,
        amount,
        user.id,
        mission.artisanId
      );

      if (result.success) {
        setPaymentStatus('success');
        setTimeout(() => {
          router.push('/rate?missionId=' + mission.id as any);
        }, 1500);
      } else {
        setPaymentStatus('error');
        Alert.alert('Échec du paiement', result.error || 'Une erreur est survenue');
        setTimeout(() => setPaymentStatus('idle'), 2000);
      }
    } catch {
      setPaymentStatus('error');
      Alert.alert('Erreur', 'Impossible de traiter le paiement');
      setTimeout(() => setPaymentStatus('idle'), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Paiement', 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mission</Text>
            <Text style={styles.summaryValue}>{mission.title}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant total</Text>
            <Text style={styles.summaryValueBold}>{amount.toFixed(2)} €</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.commissionSection}>
            <Text style={styles.commissionTitle}>Détail des frais</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.commissionLabel}>Commission plateforme ({(commission * 100).toFixed(0)}%)</Text>
              <Text style={styles.commissionValue}>- {commissionAmount.toFixed(2)} €</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.commissionLabel}>Paiement artisan</Text>
              <Text style={styles.artisanPayoutValue}>{artisanPayout.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moyen de paiement</Text>
          
          {mockPaymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodCard,
                selectedPaymentMethod?.id === method.id && styles.paymentMethodCardSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodContent}>
                <CreditCard size={24} color={selectedPaymentMethod?.id === method.id ? Colors.primary : Colors.textLight} strokeWidth={2} />
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodType,
                    selectedPaymentMethod?.id === method.id && styles.paymentMethodTypeSelected,
                  ]}>
                    {method.type === 'card' ? 'Carte bancaire' : 'PayPal'}
                  </Text>
                  {method.last4 && (
                    <Text style={styles.paymentMethodLast4}>•••• {method.last4}</Text>
                  )}
                </View>
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Par défaut</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {paymentStatus === 'success' && (
          <View style={styles.statusCard}>
            <CheckCircle size={48} color={Colors.success} strokeWidth={2} />
            <Text style={styles.statusText}>Paiement réussi !</Text>
          </View>
        )}

        {paymentStatus === 'error' && (
          <View style={[styles.statusCard, styles.statusCardError]}>
            <XCircle size={48} color={Colors.error} strokeWidth={2} />
            <Text style={[styles.statusText, styles.statusTextError]}>Paiement échoué</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedPaymentMethod || processingPayment || paymentStatus === 'success') && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedPaymentMethod || processingPayment || paymentStatus === 'success'}
          activeOpacity={0.8}
        >
          {processingPayment ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Payer {amount.toFixed(2)} €</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  summaryValueBold: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  commissionSection: {
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  commissionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  commissionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  commissionValue: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  artisanPayoutValue: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '700' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  paymentMethodTypeSelected: {
    color: Colors.primary,
  },
  paymentMethodLast4: {
    fontSize: 14,
    color: Colors.textLight,
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  statusCard: {
    backgroundColor: Colors.success + '15',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  statusCardError: {
    backgroundColor: Colors.error + '15',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  statusTextError: {
    color: Colors.error,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
