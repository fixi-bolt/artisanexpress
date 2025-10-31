import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { Euro } from 'lucide-react-native';

interface PriceTagProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'accent';
  showIcon?: boolean;
  style?: ViewStyle;
}

export function PriceTag({
  amount,
  currency = '€',
  size = 'md',
  variant = 'success',
  showIcon = true,
  style,
}: PriceTagProps) {
  const sizeConfig = {
    sm: {
      fontSize: DesignTokens.typography.fontSize.base,
      iconSize: 16,
    },
    md: {
      fontSize: DesignTokens.typography.fontSize.xl,
      iconSize: 18,
    },
    lg: {
      fontSize: DesignTokens.typography.fontSize['3xl'],
      iconSize: 24,
    },
  };

  const variantConfig = {
    default: AppColors.text.primary,
    success: AppColors.success,
    accent: AppColors.accent,
  };

  const config = sizeConfig[size];
  const color = variantConfig[variant];

  return (
    <View style={[styles.container, style]}>
      {showIcon && <Euro size={config.iconSize} color={color} strokeWidth={2.5} />}
      <Text style={[styles.amount, { fontSize: config.fontSize, color }]}>
        {amount.toLocaleString('fr-FR')}
      </Text>
      <Text style={[styles.currency, { fontSize: config.fontSize * 0.7, color }]}>
        {currency}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[1],
  },
  amount: {
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  currency: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});
