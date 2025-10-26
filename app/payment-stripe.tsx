import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { CreditCard, DollarSign, CheckCircle, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useMissions } from '@/contexts/MissionContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentStripeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const missionId = params.missionId as string;

  const { user } = useAuth();
  const { missions } = useMissions();
  const { confirmPayment, loading: confirmingPayment } = useConfirmPayment();

  const mission = missions.find(m => m.id === missionId);
  
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating' | 'confirming' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const processPaymentMutation = trpc.payments.processPayment.useMutation();

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
  const commission = 0.15;
  const commissionAmount = amount * commission;
  const artisanPayout = amount - commissionAmount;

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Erreur', 'Veuillez remplir les informations de carte');
      return;
    }

    if (!mission.artisanId || !user?.id) {
      Alert.alert('Erreur', 'Informations de mission incomplètes');
      return;
    }

    try {
      setPaymentStatus('creating');
      setErrorMessage(null);

      console.log('[STRIPE] Creating payment intent...');
      
      const paymentIntent = await createPaymentIntentMutation.mutateAsync({
        missionId: mission.id,
        amount,
        clientId: user.id,
        artisanId: mission.artisanId,
        description: mission.title,
      });

      console.log('[STRIPE] Payment intent created:', paymentIntent.id);

      if (!paymentIntent.clientSecret) {
        throw new Error('No client secret returned');
      }

      setPaymentStatus('confirming');
      console.log('[STRIPE] Confirming payment...');

      const { error, paymentIntent: confirmedPayment } = await confirmPayment(paymentIntent.clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('[STRIPE] Payment confirmation error:', error);
        setPaymentStatus('error');
        setErrorMessage(error.message);
        Alert.alert('Erreur de paiement', error.message);
        return;
      }

      if (confirmedPayment?.status === 'Succeeded') {
        console.log('[STRIPE] Payment succeeded! Processing...');
        
        const result = await processPaymentMutation.mutateAsync({
          missionId: mission.id,
          paymentIntentId: paymentIntent.id,
          clientId: user.id,
          artisanId: mission.artisanId,
          amount,
        });

        if (result.success) {
          setPaymentStatus('success');
          console.log('[STRIPE] Payment processed successfully');
          
          setTimeout(() => {
            router.push(`/rate?missionId=${mission.id}` as any);
          }, 1500);
        } else {
          setPaymentStatus('error');
          setErrorMessage(result.error || 'Échec du traitement du paiement');
          Alert.alert('Erreur', result.error || 'Échec du traitement du paiement');
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage('Paiement non confirmé');
        Alert.alert('Erreur', 'Le paiement n\'a pas été confirmé');
      }
    } catch (error: any) {
      console.error('[STRIPE] Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Une erreur est survenue');
      Alert.alert('Erreur', error.message || 'Impossible de traiter le paiement');
    }
  };

  const isProcessing = paymentStatus === 'creating' || paymentStatus === 'confirming' || confirmingPayment;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Paiement sécurisé', 
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
          <Text style={styles.sectionTitle}>Carte bancaire</Text>
          
          <View style={styles.cardFieldContainer}>
            <CreditCard size={24} color={Colors.primary} strokeWidth={2} style={styles.cardIcon} />
            
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={cardFieldStyles}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                console.log('[STRIPE] Card changed:', cardDetails.complete);
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>

          <View style={styles.testCardsInfo}>
            <Text style={styles.testCardsTitle}>💳 Cartes test:</Text>
            <Text style={styles.testCardItem}>• 4242 4242 4242 4242 (Succès)</Text>
            <Text style={styles.testCardItem}>• 4000 0000 0000 0002 (Refusée)</Text>
            <Text style={styles.testCardItem}>Date: n&apos;importe quelle date future</Text>
            <Text style={styles.testCardItem}>CVV: n&apos;importe quel 3 chiffres</Text>
          </View>
        </View>

        {paymentStatus === 'success' && (
          <View style={styles.statusCard}>
            <CheckCircle size={48} color={Colors.success} strokeWidth={2} />
            <Text style={styles.statusText}>Paiement réussi !</Text>
          </View>
        )}

        {paymentStatus === 'error' && errorMessage && (
          <View style={[styles.statusCard, styles.statusCardError]}>
            <XCircle size={48} color={Colors.error} strokeWidth={2} />
            <Text style={[styles.statusText, styles.statusTextError]}>Paiement échoué</Text>
            <Text style={styles.errorDetailText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!cardComplete || isProcessing || paymentStatus === 'success') && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || isProcessing || paymentStatus === 'success'}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.payButtonText}>
                {paymentStatus === 'creating' ? 'Création...' : 'Confirmation...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>Payer {amount.toFixed(2)} €</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardFieldStyles = {
  backgroundColor: Colors.white,
  textColor: Colors.text,
  borderWidth: 0,
  borderRadius: 12,
  fontSize: 16,
};

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
    flex: 1,
    textAlign: 'right',
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
  cardFieldContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    marginBottom: 4,
  },
  cardField: {
    flex: 1,
    height: 50,
  },
  testCardsInfo: {
    backgroundColor: Colors.primaryLight + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  testCardsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  testCardItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
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
  errorDetailText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 4,
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
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
