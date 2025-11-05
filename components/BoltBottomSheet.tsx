import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
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
    full: SCREEN_HEIGHT * 0.85,
  },
  initialSnapPoint = 'half',
  onSnapPointChange,
  headerComponent,
}: BoltBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - snapPoints[initialSnapPoint])).current;
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint>(initialSnapPoint);
  const currentSnapPointRef = useRef<SnapPoint>(initialSnapPoint);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const [scrollEnabled, setScrollEnabled] = useState(initialSnapPoint === 'full');

  const snapToPoint = useCallback(
    (snapPoint: SnapPoint) => {
      const targetY = SCREEN_HEIGHT - snapPoints[snapPoint];
      
      setCurrentSnapPoint(snapPoint);
      currentSnapPointRef.current = snapPoint;
      setScrollEnabled(snapPoint === 'full');
      
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
        stiffness: 100,
      }).start(() => {
        const progress = snapPoint === 'full' ? 1 : snapPoint === 'half' ? 0.5 : 0;
        onSnapPointChange?.(snapPoint, progress);
      });
    },
    [translateY, snapPoints, onSnapPointChange]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        const isDraggingDown = dy > 5;
        const isDraggingUp = dy < -5;
        
        if (isDraggingDown && scrollOffset.current <= 0) {
          return true;
        }
        
        if (isDraggingUp && scrollOffset.current <= 0 && currentSnapPointRef.current !== 'full') {
          return true;
        }
        
        return false;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        const currentY = SCREEN_HEIGHT - snapPoints[currentSnapPointRef.current];
        const newY = currentY + dy;
        
        const minY = SCREEN_HEIGHT - snapPoints.full;
        const maxY = SCREEN_HEIGHT - snapPoints.closed;
        const clampedY = Math.max(minY, Math.min(maxY, newY));
        
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        
        let targetSnapPoint: SnapPoint = currentSnapPointRef.current;
        
        if (Math.abs(vy) > 0.5) {
          if (vy < 0) {
            targetSnapPoint = currentSnapPointRef.current === 'closed' ? 'half' : 'full';
          } else {
            targetSnapPoint = currentSnapPointRef.current === 'full' ? 'half' : 'closed';
          }
        } else if (Math.abs(dy) > 50) {
          if (dy < 0) {
            targetSnapPoint = currentSnapPointRef.current === 'closed' ? 'half' : 'full';
          } else {
            targetSnapPoint = currentSnapPointRef.current === 'full' ? 'half' : 'closed';
          }
        }
        
        snapToPoint(targetSnapPoint);
      },
    })
  ).current;

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

      {headerComponent && <View style={styles.header}>{headerComponent as any}</View>}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={currentSnapPoint === 'full'}
        scrollEnabled={scrollEnabled}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
      >
        {children}
      </ScrollView>
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
  },
  handleContainer: {
    paddingVertical: DesignTokens.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[3],
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
