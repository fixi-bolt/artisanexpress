import { CardField as NativeCardField, CardFieldInput } from '@stripe/stripe-react-native';
import { ViewStyle } from 'react-native';

interface StripeCardFieldProps {
  onCardChange: (cardDetails: CardFieldInput.Details) => void;
  style?: ViewStyle;
  cardStyle?: any;
  postalCodeEnabled?: boolean;
  placeholders?: {
    number?: string;
  };
}

export function StripeCardField({ 
  onCardChange, 
  style, 
  cardStyle, 
  postalCodeEnabled = false,
  placeholders 
}: StripeCardFieldProps) {
  return (
    <NativeCardField
      postalCodeEnabled={postalCodeEnabled}
      placeholders={placeholders}
      cardStyle={cardStyle}
      style={style}
      onCardChange={onCardChange}
    />
  );
}
