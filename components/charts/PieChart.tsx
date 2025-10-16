import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataPoint[];
  size?: number;
  showLegend?: boolean;
}

export function PieChart({
  data,
  size = 200,
  showLegend = true,
}: PieChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
    };
  });

  const radius = size / 2;
  const strokeWidth = 40;
  const innerRadius = radius - strokeWidth;

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        {slices.map((slice, index) => {
          const angle = (slice.startAngle + slice.endAngle) / 2;
          const x = radius + Math.cos((angle - 90) * (Math.PI / 180)) * (radius - strokeWidth / 2);
          const y = radius + Math.sin((angle - 90) * (Math.PI / 180)) * (radius - strokeWidth / 2);

          return (
            <View
              key={index}
              style={[
                styles.slice,
                {
                  width: strokeWidth,
                  height: strokeWidth,
                  borderRadius: strokeWidth / 2,
                  backgroundColor: slice.color,
                  position: 'absolute',
                  left: x - strokeWidth / 2,
                  top: y - strokeWidth / 2,
                },
              ]}
            />
          );
        })}
        
        <View
          style={[
            styles.innerCircle,
            {
              width: innerRadius * 2,
              height: innerRadius * 2,
              borderRadius: innerRadius,
              top: strokeWidth / 2,
              left: strokeWidth / 2,
            },
          ]}
        />
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {slices.map((slice, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
              <Text style={styles.legendLabel}>{slice.label}</Text>
              <Text style={styles.legendValue}>
                {slice.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 80,
  },
  chartContainer: {
    position: 'relative',
  },
  slice: {
    position: 'absolute',
  },
  innerCircle: {
    position: 'absolute',
    backgroundColor: colors.background,
  },
  legend: {
    marginTop: 24,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
