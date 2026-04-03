import { TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { LucideIcon } from 'lucide-react-native';
import { useRef } from 'react';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  badge?: number;
}

export function IconButton({
  icon: Icon,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
  badge,
}: IconButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const sizeConfig = {
    sm: { container: 36, icon: 18 },
    md: { container: 44, icon: 22 },
    lg: { container: 56, icon: 28 },
  };

  const variantConfig = {
    default: {
      bg: AppColors.surface,
      iconColor: AppColors.text.primary,
    },
    primary: {
      bg: AppColors.primary,
      iconColor: AppColors.text.inverse,
    },
    ghost: {
      bg: 'transparent',
      iconColor: AppColors.text.primary,
    },
    danger: {
      bg: AppColors.error + '15',
      iconColor: AppColors.error,
    },
  };

  const config = sizeConfig[size];
  const colors = variantConfig[variant];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
            backgroundColor: colors.bg,
          },
          variant === 'default' && styles.defaultShadow,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Icon size={config.icon} color={colors.iconColor} strokeWidth={2} />
        {badge !== undefined && badge > 0 && (
          <Animated.View style={styles.badge}>
            <Animated.Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Animated.Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  defaultShadow: {
    ...DesignTokens.shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: AppColors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.inverse,
  },
});
