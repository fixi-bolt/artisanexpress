import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { useEffect, useRef } from 'react';

type Status = 'available' | 'busy' | 'offline' | 'pending' | 'completed' | 'cancelled';

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  style?: ViewStyle;
}

const statusConfig: Record<Status, { color: string; label: string }> = {
  available: { color: AppColors.success, label: 'Disponible' },
  busy: { color: AppColors.warning, label: 'Occupé' },
  offline: { color: DesignTokens.colors.neutral[400], label: 'Hors ligne' },
  pending: { color: AppColors.info, label: 'En attente' },
  completed: { color: AppColors.success, label: 'Terminé' },
  cancelled: { color: AppColors.error, label: 'Annulé' },
};

const sizes = {
  sm: 8,
  md: 10,
  lg: 12,
};

export function StatusIndicator({ status, label, size = 'md', showPulse = false, style }: StatusIndicatorProps) {
  const config = statusConfig[status];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showPulse && (status === 'available' || status === 'busy')) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [showPulse, status, pulseAnim]);

  const dotSize = sizes[size];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotContainer}>
        {showPulse && (status === 'available' || status === 'busy') && (
          <Animated.View
            style={[
              styles.pulse,
              {
                width: dotSize * 2,
                height: dotSize * 2,
                borderRadius: dotSize,
                backgroundColor: config.color + '40',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>
      {(label || label === undefined) && (
        <Text style={[styles.label, { color: config.color }]}>
          {label || config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
  },
  dotContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    ...DesignTokens.shadows.sm,
  },
  label: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});
