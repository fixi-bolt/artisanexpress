import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { DesignTokens } from '@/constants/design-tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export type SnapPoint = 'closed' | 'half' | 'full';

interface BoltBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: {
    closed: number;
    half: number;
    full: number;
  };
  initialSnapPoint?: SnapPoint;
  onSnapPointChange?: (snapPoint: SnapPoint, progress: number) => void;
  headerComponent?: React.ReactNode;
}

export function BoltBottomSheet({
  children,
  snapPoints = {
    closed: 120,
    half: SCREEN_HEIGHT * 0.5,
    full: SCREEN_HEIGHT * 0.8,
  },
  initialSnapPoint = 'half',
  onSnapPointChange,
  headerComponent,
}: BoltBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(
    new Animated.Value(SCREEN_HEIGHT - snapPoints[initialSnapPoint])
  ).current;
  const lastGesture = useRef(SCREEN_HEIGHT - snapPoints[initialSnapPoint]);
  const currentSnapPoint = useRef<SnapPoint>(initialSnapPoint);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(lastGesture.current);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = gestureState.dy;
        const minY = SCREEN_HEIGHT - snapPoints.full;
        const maxY = SCREEN_HEIGHT - snapPoints.closed;

        const clampedValue = Math.max(minY, Math.min(maxY, newValue));
        translateY.setValue(clampedValue);

        const totalDistance = maxY - minY;
        const currentDistance = clampedValue - minY;
        const progress = 1 - currentDistance / totalDistance;

        const snapPoint = getClosestSnapPoint(SCREEN_HEIGHT - clampedValue, snapPoints);
        onSnapPointChange?.(snapPoint, progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        const velocity = gestureState.vy;
        const currentY = lastGesture.current + gestureState.dy;

        let targetSnapPoint: SnapPoint;
        let targetY: number;

        if (Math.abs(velocity) > 0.5) {
          if (velocity < 0) {
            if (currentSnapPoint.current === 'closed') {
              targetSnapPoint = 'half';
            } else {
              targetSnapPoint = 'full';
            }
          } else {
            if (currentSnapPoint.current === 'full') {
              targetSnapPoint = 'half';
            } else {
              targetSnapPoint = 'closed';
            }
          }
        } else {
          const currentHeight = SCREEN_HEIGHT - currentY;
          targetSnapPoint = getClosestSnapPoint(currentHeight, snapPoints);
        }

        targetY = SCREEN_HEIGHT - snapPoints[targetSnapPoint];
        lastGesture.current = targetY;
        currentSnapPoint.current = targetSnapPoint;

        Animated.spring(translateY, {
          toValue: targetY,
          useNativeDriver: true,
          tension: 68,
          friction: 12,
          velocity: velocity * -1,
        }).start(() => {
          const progress =
            targetSnapPoint === 'full' ? 1 : targetSnapPoint === 'half' ? 0.5 : 0;
          onSnapPointChange?.(targetSnapPoint, progress);
        });
      },
    })
  ).current;

  const getClosestSnapPoint = (
    height: number,
    points: { closed: number; half: number; full: number }
  ): SnapPoint => {
    const distances = {
      closed: Math.abs(height - points.closed),
      half: Math.abs(height - points.half),
      full: Math.abs(height - points.full),
    };

    const closest = Object.entries(distances).reduce((prev, curr) =>
      curr[1] < prev[1] ? curr : prev
    );

    return closest[0] as SnapPoint;
  };



  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      const currentHeight = SCREEN_HEIGHT - value;
      const totalDistance = snapPoints.full - snapPoints.closed;
      const currentDistance = currentHeight - snapPoints.closed;
      const progress = Math.max(0, Math.min(1, currentDistance / totalDistance));

      const snapPoint = getClosestSnapPoint(currentHeight, snapPoints);
      onSnapPointChange?.(snapPoint, progress);
    });

    return () => {
      translateY.removeListener(listenerId);
    };
  }, [translateY, snapPoints, onSnapPointChange]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.handleContainer} {...panResponder.panHandlers}>
        <View style={styles.handle} />
      </View>

      {headerComponent && <View style={styles.header}>{headerComponent}</View>}

      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: DesignTokens.borderRadius['2xl'],
    borderTopRightRadius: DesignTokens.borderRadius['2xl'],
    ...DesignTokens.shadows.xl,
    overflow: 'hidden',
  },
  handleContainer: {
    paddingVertical: DesignTokens.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.borderLight,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[3],
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
