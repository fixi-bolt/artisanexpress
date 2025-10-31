import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? AppColors.text.inverse : AppColors.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle, styles[`${size}Text` as keyof typeof styles] as TextStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignTokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...DesignTokens.shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  
  primary: {
    backgroundColor: AppColors.primary,
  },
  secondary: {
    backgroundColor: AppColors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  sm: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    minHeight: 36,
  },
  md: {
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[3],
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    minHeight: 56,
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  text: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  primaryText: {
    color: AppColors.text.inverse,
  },
  secondaryText: {
    color: AppColors.text.inverse,
  },
  outlineText: {
    color: AppColors.primary,
  },
  ghostText: {
    color: AppColors.primary,
  },
  
  smText: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  mdText: {
    fontSize: DesignTokens.typography.fontSize.base,
  },
  lgText: {
    fontSize: DesignTokens.typography.fontSize.lg,
  },
});
