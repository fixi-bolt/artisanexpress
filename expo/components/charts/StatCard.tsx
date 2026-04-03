import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = colors.primary,
  trend,
  trendLabel,
}: StatCardProps) {
  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {Icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Icon size={20} color={iconColor} />
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>

      {(subtitle || trend !== undefined) && (
        <View style={styles.footer}>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {trend !== undefined && (
            <View style={styles.trendContainer}>
              <Text
                style={[
                  styles.trend,
                  { color: isPositiveTrend ? colors.success : colors.error },
                ]}
              >
                {isPositiveTrend ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </Text>
              {trendLabel && (
                <Text style={styles.trendLabel}>{trendLabel}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trend: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  trendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
