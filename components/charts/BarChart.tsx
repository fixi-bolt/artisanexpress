import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  showValues?: boolean;
  horizontal?: boolean;
}

export function BarChart({
  data,
  height = 200,
  showValues = true,
  horizontal = false,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  if (horizontal) {
    return (
      <View style={styles.container}>
        {data.map((item, index) => {
          const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <View key={index} style={styles.horizontalBarContainer}>
              <Text style={styles.horizontalLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={styles.horizontalBarWrapper}>
                <View
                  style={[
                    styles.horizontalBar,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: item.color || colors.primary,
                    },
                  ]}
                />
                {showValues && (
                  <Text style={styles.horizontalValue}>
                    {item.value.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 20) : 0;
          
          return (
            <View key={index} style={styles.barContainer}>
              {showValues && (
                <Text style={styles.valueText}>{item.value}</Text>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: item.color || colors.primary,
                  },
                ]}
              />
              <Text style={styles.labelText} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 80,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  labelText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  horizontalBarContainer: {
    marginBottom: 16,
  },
  horizontalLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  horizontalBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBar: {
    height: 24,
    borderRadius: 4,
    minWidth: 2,
  },
  horizontalValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 8,
  },
});
