import { useConfirmPayment } from '@stripe/stripe-react-native';

export function useStripePayment() {
  const { confirmPayment, loading } = useConfirmPayment();

  const confirmCardPayment = async (clientSecret: string) => {
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    return {
      error: error ? { message: error.message } : null,
      paymentIntent: paymentIntent
        ? {
            status: paymentIntent.status === 'Succeeded' ? 'succeeded' : paymentIntent.status.toLowerCase(),
            id: paymentIntent.id,
          }
        : null,
    };
  };

  return {
    confirmCardPayment,
    loading,
  };
}
