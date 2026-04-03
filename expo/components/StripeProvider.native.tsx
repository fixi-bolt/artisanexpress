import { ReactNode, ReactElement } from 'react';
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';

interface StripeProviderProps {
  publishableKey: string;
  children: ReactNode;
}

export function StripeProvider({ publishableKey, children }: StripeProviderProps) {
  if (!publishableKey) {
    console.warn('[Stripe Native] No publishable key provided, Stripe features will be disabled');
    return <>{children}</>;
  }
  return (
    <NativeStripeProvider publishableKey={publishableKey}>
      {children as ReactElement}
    </NativeStripeProvider>
  );
}
