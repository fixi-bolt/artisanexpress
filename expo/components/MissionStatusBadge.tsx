import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle, XCircle, Navigation, DollarSign, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { Mission } from '@/types';

interface MissionStatusBadgeProps {
  status: Mission['status'];
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: Colors.warning,
    icon: Clock,
    bgColor: Colors.warning + '15',
  },
  accepted: {
    label: 'Acceptée',
    color: Colors.info,
    icon: CheckCircle,
    bgColor: Colors.info + '15',
  },
  in_progress: {
    label: 'En cours',
    color: Colors.primary,
    icon: Navigation,
    bgColor: Colors.primaryLight + '15',
  },
  completed: {
    label: 'Terminée',
    color: Colors.success,
    icon: CheckCircle,
    bgColor: Colors.success + '15',
  },
  cancelled: {
    label: 'Annulée',
    color: Colors.error,
    icon: XCircle,
    bgColor: Colors.error + '15',
  },
  paid: {
    label: 'Payée',
    color: Colors.success,
    icon: DollarSign,
    bgColor: Colors.success + '15',
  },
  rated: {
    label: 'Notée',
    color: Colors.secondary,
    icon: Star,
    bgColor: Colors.secondary + '15',
  },
};

export default function MissionStatusBadge({ status, size = 'medium' }: MissionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      iconSize: 12,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      iconSize: 16,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, { backgroundColor: config.bgColor }]}>
      <Icon size={currentSize.iconSize} color={config.color} strokeWidth={2.5} />
      <Text style={[styles.text, currentSize.text, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    gap: 4,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  containerMedium: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  containerLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  text: {
    fontWeight: '600' as const,
  },
  textSmall: {
    fontSize: 11,
  },
  textMedium: {
    fontSize: 13,
  },
  textLarge: {
    fontSize: 15,
  },
});
