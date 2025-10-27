import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface StripeProviderProps {
  publishableKey: string;
  children: ReactNode;
}

export function StripeProvider({ publishableKey, children }: StripeProviderProps) {
  if (!publishableKey) {
    console.warn('[Stripe Web] No publishable key provided, Stripe features will be disabled');
    return <>{children}</>;
  }
  const stripePromise = loadStripe(publishableKey);
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
