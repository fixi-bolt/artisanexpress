import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, Animated } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled';
}

export function Input({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  containerStyle,
  variant = 'default',
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? AppColors.error : AppColors.border.default,
      error ? AppColors.error : AppColors.primary,
    ],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          variant === 'filled' && styles.inputContainerFilled,
          { borderColor },
        ]}
      >
        {LeftIcon && (
          <LeftIcon
            size={20}
            color={isFocused ? AppColors.primary : AppColors.text.secondary}
            strokeWidth={2}
          />
        )}
        <TextInput
          style={[styles.input, LeftIcon && styles.inputWithLeftIcon]}
          placeholderTextColor={AppColors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {RightIcon && (
          <RightIcon
            size={20}
            color={isFocused ? AppColors.primary : AppColors.text.secondary}
            strokeWidth={2}
          />
        )}
      </Animated.View>
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing[4],
  },
  label: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: AppColors.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[2],
    minHeight: 52,
    ...DesignTokens.shadows.sm,
  },
  inputContainerFilled: {
    backgroundColor: AppColors.background,
  },
  input: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: AppColors.text.primary,
    paddingVertical: DesignTokens.spacing[3],
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  helperText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.text.secondary,
    marginTop: DesignTokens.spacing[1],
    marginLeft: DesignTokens.spacing[1],
  },
  errorText: {
    color: AppColors.error,
  },
});
