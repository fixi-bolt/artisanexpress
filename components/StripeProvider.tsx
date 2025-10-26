import { Platform } from 'react-native';
import { ReactNode } from 'react';

// Import conditionnel pour éviter les erreurs de build
let NativeStripeProvider: any;
let WebStripeProvider: any;
let loadStripe: any;

if (Platform.OS !== 'web') {
  NativeStripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} else {
  const stripe = require('@stripe/react-stripe-js');
  WebStripeProvider = stripe.Elements;
  loadStripe = require('@stripe/stripe-js').loadStripe;
}

interface StripeProviderProps {
  publishableKey: string;
  children: ReactNode;
}

export function StripeProvider({ publishableKey, children }: StripeProviderProps) {
  if (Platform.OS !== 'web') {
    return <NativeStripeProvider publishableKey={publishableKey}>{children}</NativeStripeProvider>;
  }

  // Pour le web, initialiser Stripe.js
  const stripePromise = loadStripe(publishableKey);
  return <WebStripeProvider stripe={stripePromise}>{children}</WebStripeProvider>;
}
