import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
}

export function LineChart({
  data,
  height = 200,
  color = colors.primary,
  showGrid = true,
  showLabels = true,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = height - 40;
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  const points = data.map((point, index) => {
    const x = index * pointSpacing;
    const normalizedValue = (point.value - minValue) / valueRange;
    const y = chartHeight - (normalizedValue * chartHeight);
    return { x, y, value: point.value };
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.chartArea, { height: chartHeight }]}>
        {showGrid && (
          <>
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />
          </>
        )}

        <View style={styles.lineContainer}>
          {points.map((point, index) => {
            if (index === 0) return null;
            
            const prevPoint = points[index - 1];
            const deltaX = point.x - prevPoint.x;
            const deltaY = point.y - prevPoint.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            return (
              <View
                key={index}
                style={[
                  styles.line,
                  {
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: distance,
                    backgroundColor: color,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>

        {points.map((point, index) => (
          <View
            key={index}
            style={[
              styles.point,
              {
                left: point.x - 4,
                top: point.y - 4,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>

      {showLabels && (
        <View style={styles.labelsContainer}>
          {data.map((point, index) => {
            if (data.length > 10 && index % Math.ceil(data.length / 5) !== 0) {
              return null;
            }
            
            return (
              <Text
                key={index}
                style={[styles.label, { left: (index * pointSpacing) - 20 }]}
              >
                {new Date(point.date).getDate()}/{new Date(point.date).getMonth() + 1}
              </Text>
            );
          })}
        </View>
      )}
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
    width: '100%',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  lineContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelsContainer: {
    flexDirection: 'row',
    height: 20,
    position: 'relative',
    marginTop: 10,
  },
  label: {
    position: 'absolute',
    fontSize: 10,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
});
