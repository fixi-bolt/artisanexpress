import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { useAuth } from './AuthContext';
import { trpc } from '@/lib/trpc';

export const [PaymentContext, usePayments] = createContextHook(() => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);

  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const processPaymentMutation = trpc.payments.processPayment.useMutation();

  const calculateCommission = useCallback((amount: number): { commission: number; commissionAmount: number; artisanPayout: number } => {
    const commission = amount > 150 ? 0.15 : 0.10;
    const commissionAmount = amount * commission;
    const artisanPayout = amount - commissionAmount;

    return {
      commission,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      artisanPayout: parseFloat(artisanPayout.toFixed(2)),
    };
  }, []);

  const createPaymentIntent = useCallback(async (missionId: string, amount: number) => {
    console.log('Creating payment intent:', { missionId, amount });
    
    try {
      const result = await createPaymentIntentMutation.mutateAsync({
        missionId,
        amount,
        clientId: user?.id || '',
        artisanId: '',
      });

      return result;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  }, [createPaymentIntentMutation, user?.id]);

  const processPayment = useCallback(async (
    missionId: string,
    paymentIntentId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    clientId: string,
    artisanId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    setProcessingPayment(true);

    try {
      const result = await processPaymentMutation.mutateAsync({
        missionId,
        paymentIntentId,
        clientId,
        artisanId,
        amount,
      });

      if (result.success && result.transactionId) {
        const { commission, commissionAmount, artisanPayout } = calculateCommission(amount);

        const transaction: Transaction = {
          id: result.transactionId,
          missionId,
          clientId,
          artisanId,
          amount,
          commission,
          commissionAmount,
          artisanPayout,
          status: 'completed',
          paymentMethod,
          createdAt: new Date(),
          processedAt: new Date(),
        };

        setTransactions(prev => [transaction, ...prev]);
        console.log('Payment processed successfully:', transaction);

        return { success: true, transactionId: result.transactionId };
      } else {
        return { success: false, error: result.error || 'Payment failed' };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed. Please try again.' };
    } finally {
      setProcessingPayment(false);
    }
  }, [calculateCommission, processPaymentMutation]);

  const getTransactionByMission = useCallback((missionId: string): Transaction | undefined => {
    return transactions.find(t => t.missionId === missionId);
  }, [transactions]);

  const getUserTransactions = useCallback((): Transaction[] => {
    if (!user) return [];

    if (user.type === 'client') {
      return transactions.filter(t => t.clientId === user.id);
    } else {
      return transactions.filter(t => t.artisanId === user.id);
    }
  }, [user, transactions]);

  const getTotalEarnings = useCallback((): number => {
    if (!user || user.type !== 'artisan') return 0;

    return transactions
      .filter(t => t.artisanId === user.id && t.status === 'completed')
      .reduce((sum, t) => sum + t.artisanPayout, 0);
  }, [user, transactions]);

  const getTotalCommissions = useCallback((): number => {
    if (!user || user.type !== 'artisan') return 0;

    return transactions
      .filter(t => t.artisanId === user.id && t.status === 'completed')
      .reduce((sum, t) => sum + t.commissionAmount, 0);
  }, [user, transactions]);

  return useMemo(() => ({
    transactions,
    processingPayment,
    calculateCommission,
    createPaymentIntent,
    processPayment,
    getTransactionByMission,
    getUserTransactions,
    getTotalEarnings,
    getTotalCommissions,
  }), [
    transactions,
    processingPayment,
    calculateCommission,
    createPaymentIntent,
    processPayment,
    getTransactionByMission,
    getUserTransactions,
    getTotalEarnings,
    getTotalCommissions,
  ]);
});
