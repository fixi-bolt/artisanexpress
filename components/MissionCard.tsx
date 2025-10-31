import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { DesignTokens, AppColors } from '@/constants/design-tokens';
import { MapPin, Clock, Image as ImageIcon } from 'lucide-react-native';
import { Card, PriceTag, Badge } from '@/components/ui';
import { useRef } from 'react';

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    description: string;
    estimatedPrice: number;
    address?: string;
    photos?: string[];
    distanceKm?: number;
    createdAt: Date;
    urgent?: boolean;
  };
  onAccept?: () => void;
  onPress?: () => void;
  variant?: 'default' | 'compact';
}

export function MissionCard({ mission, onAccept, onPress, variant = 'default' }: MissionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeAgo = Math.floor((Date.now() - mission.createdAt.getTime()) / 60000);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  const cardContent = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Clock size={14} color={AppColors.text.secondary} strokeWidth={2} />
          <Text style={styles.timeText}>Il y a {timeAgo} min</Text>
        </View>
        <View style={styles.badges}>
          {mission.urgent && <Badge label="URGENT" variant="error" size="sm" />}
          {mission.distanceKm !== undefined && (
            <Badge
              label={`${mission.distanceKm.toFixed(1)} km`}
              variant="primary"
              size="sm"
              dot
            />
          )}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {mission.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {mission.description}
      </Text>

      <View style={styles.details}>
        {mission.address && (
          <View style={styles.detail}>
            <MapPin size={16} color={AppColors.text.secondary} strokeWidth={2} />
            <Text style={styles.detailText} numberOfLines={1}>
              {mission.address.split(',')[0]}
            </Text>
          </View>
        )}
        {mission.photos && mission.photos.length > 0 && (
          <View style={styles.detail}>
            <ImageIcon size={16} color={AppColors.text.secondary} strokeWidth={2} />
            <Text style={styles.detailText}>
              {mission.photos.length} photo{mission.photos.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <PriceTag amount={mission.estimatedPrice} size="md" variant="success" />
        {onAccept && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Card variant="elevated">{cardContent}</Card>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <Card variant="elevated">{cardContent}</Card>;
}

const styles = StyleSheet.create({
  container: {
    gap: DesignTokens.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[1],
  },
  timeText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  badges: {
    flexDirection: 'row',
    gap: DesignTokens.spacing[2],
    flexWrap: 'wrap',
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.primary,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.text.secondary,
    lineHeight: DesignTokens.typography.fontSize.sm * DesignTokens.typography.lineHeight.relaxed,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing[4],
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[1],
    flex: 1,
    minWidth: '40%',
  },
  detailText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: DesignTokens.spacing[2],
  },
  acceptButton: {
    backgroundColor: AppColors.accent,
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[6],
    borderRadius: DesignTokens.borderRadius.md,
    ...DesignTokens.shadows.md,
  },
  acceptButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: AppColors.text.inverse,
  },
});
