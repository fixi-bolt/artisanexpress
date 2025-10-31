import { TouchableOpacity, StyleSheet, Animated, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { LucideIcon } from 'lucide-react-native';
import { useRef } from 'react';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  color?: string;
  size?: 'md' | 'lg';
  style?: ViewStyle;
}

export function FloatingActionButton({
  icon: Icon,
  onPress,
  position = 'bottom-right',
  color = AppColors.accent,
  size = 'lg',
  style,
}: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const sizeConfig = {
    md: { container: 56, icon: 24 },
    lg: { container: 64, icon: 28 },
  };

  const config = sizeConfig[size];

  const positionStyle = {
    'bottom-right': { bottom: DesignTokens.spacing[6], right: DesignTokens.spacing[6] },
    'bottom-left': { bottom: DesignTokens.spacing[6], left: DesignTokens.spacing[6] },
    'bottom-center': { bottom: DesignTokens.spacing[6], alignSelf: 'center' as const },
  };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle[position],
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
            backgroundColor: color,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon size={config.icon} color={AppColors.text.inverse} strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.xl,
  },
});
