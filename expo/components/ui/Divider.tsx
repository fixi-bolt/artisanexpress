import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';

interface DividerProps {
  label?: string;
  style?: ViewStyle;
  color?: string;
  thickness?: number;
}

export function Divider({ label, style, color = AppColors.border.default, thickness = 1 }: DividerProps) {
  if (label) {
    return (
      <View style={[styles.containerWithLabel, style]}>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
      </View>
    );
  }

  return <View style={[styles.divider, { backgroundColor: color, height: thickness }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
  containerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[3],
  },
  line: {
    flex: 1,
  },
  label: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: AppColors.text.secondary,
  },
});
