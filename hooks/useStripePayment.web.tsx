import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState } from 'react';

export function useStripePayment() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const confirmCardPayment = async (clientSecret: string) => {
    if (!stripe || !elements) {
      return {
        error: { message: 'Stripe not initialized' },
        paymentIntent: null,
      };
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        return {
          error: { message: 'Card element not found' },
          paymentIntent: null,
        };
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      setLoading(false);

      if (result.error) {
        return {
          error: { message: result.error.message || 'Payment failed' },
          paymentIntent: null,
        };
      }

      return {
        error: null,
        paymentIntent: {
          status: result.paymentIntent?.status || 'unknown',
          id: result.paymentIntent?.id || '',
        },
      };
    } catch (error: any) {
      setLoading(false);
      return {
        error: { message: error.message || 'Payment failed' },
        paymentIntent: null,
      };
    }
  };

  return {
    confirmCardPayment,
    loading,
  };
}
