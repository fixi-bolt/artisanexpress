import { View, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing[4],
  },
  default: {
    ...DesignTokens.shadows.sm,
  },
  elevated: {
    ...DesignTokens.shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: AppColors.border.default,
  },
});
