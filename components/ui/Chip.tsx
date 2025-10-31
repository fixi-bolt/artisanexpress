import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { LucideIcon } from 'lucide-react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon: Icon,
  variant = 'default',
  size = 'md',
  style,
}: ChipProps) {
  const isInteractive = Boolean(onPress);

  const getBackgroundColor = () => {
    if (selected) {
      return variant === 'primary' ? AppColors.primary : AppColors.accent;
    }
    return AppColors.surface;
  };

  const getTextColor = () => {
    if (selected) {
      return AppColors.text.inverse;
    }
    return AppColors.text.primary;
  };

  const iconColor = selected ? AppColors.text.inverse : AppColors.text.secondary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        styles[size],
        {
          backgroundColor: getBackgroundColor(),
          borderColor: selected ? 'transparent' : AppColors.border.default,
        },
        selected && styles.selected,
        style,
      ]}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={isInteractive ? 0.7 : 1}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} color={iconColor} strokeWidth={2} />}
      <Text
        style={[
          styles.text,
          styles[`${size}Text`],
          { color: getTextColor() },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    ...DesignTokens.shadows.sm,
  },
  sm: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.md,
    gap: DesignTokens.spacing[1],
  },
  md: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.lg,
    gap: DesignTokens.spacing[2],
  },
  selected: {
    ...DesignTokens.shadows.md,
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
});
