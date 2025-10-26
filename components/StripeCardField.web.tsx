import { CardElement, useElements } from '@stripe/react-stripe-js';
import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import Colors from '@/constants/colors';

interface StripeCardFieldProps {
  onCardChange: (cardDetails: { complete: boolean }) => void;
  style?: any;
  cardStyle?: any;
  postalCodeEnabled?: boolean;
  placeholders?: {
    number?: string;
  };
}

export function StripeCardField({ onCardChange, style }: StripeCardFieldProps) {
  const elements = useElements();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const handleChange = (event: any) => {
      setIsComplete(event.complete);
      onCardChange({ complete: event.complete });
    };

    cardElement.on('change', handleChange);
    return () => {
      cardElement.off('change', handleChange);
    };
  }, [elements, onCardChange]);

  return (
    <View style={[styles.container, style]}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: Colors.text,
              '::placeholder': {
                color: Colors.textSecondary,
              },
            },
            invalid: {
              color: Colors.error,
            },
          },
          hidePostalCode: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
