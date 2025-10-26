import { ReactNode } from 'react';
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';

interface StripeProviderProps {
  publishableKey: string;
  children: ReactNode;
}

export function StripeProvider({ publishableKey, children }: StripeProviderProps) {
  return <NativeStripeProvider publishableKey={publishableKey}>{children}</NativeStripeProvider>;
}
