import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { useEffect, useRef } from 'react';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color = AppColors.primary,
  backgroundColor = DesignTokens.colors.neutral[200],
  animated = true,
  style,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedWidth, {
        toValue: Math.max(0, Math.min(1, progress)),
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.max(0, Math.min(1, progress)));
    }
  }, [progress, animated, animatedWidth]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            width,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});
