import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { useAuth } from './AuthContext';

export const [PaymentContext, usePayments] = createContextHook(() => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);

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
    console.log('[PaymentContext] Creating payment intent:', { missionId, amount });
    console.log('[PaymentContext] Backend features disabled - use Stripe directly');
    throw new Error('Backend not available - use direct Stripe integration');
  }, []);

  const processPayment = useCallback(async (
    missionId: string,
    paymentIntentId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    clientId: string,
    artisanId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    setProcessingPayment(true);
    
    console.log('[PaymentContext] Processing payment - Backend features disabled');
    console.log('[PaymentContext] Use direct Stripe integration or enable backend');

    setProcessingPayment(false);
    return { success: false, error: 'Backend not available - use direct Stripe integration' };
  }, []);

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
