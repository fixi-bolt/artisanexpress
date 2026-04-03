import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showBadge?: boolean;
  badgeColor?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

const fontSizeMap = {
  xs: DesignTokens.typography.fontSize.xs,
  sm: DesignTokens.typography.fontSize.sm,
  md: DesignTokens.typography.fontSize.base,
  lg: DesignTokens.typography.fontSize.xl,
  xl: DesignTokens.typography.fontSize['2xl'],
};

export function Avatar({ name, imageUrl, size = 'md', style, showBadge = false, badgeColor }: AvatarProps) {
  const avatarSize = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const badgeSize = avatarSize * 0.25;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, style]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badgeColor || AppColors.success,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    ...DesignTokens.shadows.sm,
  },
  placeholder: {
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.sm,
  },
  initials: {
    color: AppColors.text.inverse,
    fontWeight: DesignTokens.typography.fontWeight.bold,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
});
