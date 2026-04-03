import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: {
    bg: AppColors.success + '15',
    text: AppColors.success,
    border: AppColors.success + '30',
  },
  warning: {
    bg: AppColors.warning + '15',
    text: AppColors.warning,
    border: AppColors.warning + '30',
  },
  error: {
    bg: AppColors.error + '15',
    text: AppColors.error,
    border: AppColors.error + '30',
  },
  info: {
    bg: AppColors.info + '15',
    text: AppColors.info,
    border: AppColors.info + '30',
  },
  neutral: {
    bg: DesignTokens.colors.neutral[100],
    text: DesignTokens.colors.neutral[700],
    border: DesignTokens.colors.neutral[200],
  },
  primary: {
    bg: AppColors.primary + '15',
    text: AppColors.primary,
    border: AppColors.primary + '30',
  },
};

export function Badge({ label, variant = 'neutral', size = 'md', style, textStyle, dot = false }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        styles[size],
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: colors.text }]} />}
      <Text
        style={[
          styles.text,
          styles[`${size}Text`],
          { color: colors.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  sm: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.sm,
    gap: DesignTokens.spacing[1],
  },
  md: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.md,
    gap: DesignTokens.spacing[1],
  },
  lg: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.md,
    gap: DesignTokens.spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  smText: {
    fontSize: DesignTokens.typography.fontSize.xs,
  },
  mdText: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  lgText: {
    fontSize: DesignTokens.typography.fontSize.base,
  },
});
