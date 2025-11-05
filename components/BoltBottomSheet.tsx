import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { DesignTokens } from '@/constants/design-tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MINIMUM_DRAG_DISTANCE = 8;
const VELOCITY_THRESHOLD = 0.4;

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
  enablePanDownToClose?: boolean;
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
  enablePanDownToClose = true,
}: BoltBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - snapPoints[initialSnapPoint])).current;
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint>(initialSnapPoint);
  const currentSnapPointRef = useRef<SnapPoint>(initialSnapPoint);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const scrollEnabledRef = useRef(initialSnapPoint === 'full');
  const isDraggingSheet = useRef(false);

  const snapToPoint = useCallback(
    (snapPoint: SnapPoint, animated = true) => {
      const targetY = SCREEN_HEIGHT - snapPoints[snapPoint];
      
      setCurrentSnapPoint(snapPoint);
      currentSnapPointRef.current = snapPoint;
      scrollEnabledRef.current = snapPoint === 'full';
      
      if (!animated) {
        translateY.setValue(targetY);
        const progress = snapPoint === 'full' ? 1 : snapPoint === 'half' ? 0.5 : 0;
        onSnapPointChange?.(snapPoint, progress);
        return;
      }
      
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

  useEffect(() => {
    if (currentSnapPointRef.current !== initialSnapPoint) {
      snapToPoint(initialSnapPoint, false);
    }
  }, [initialSnapPoint, snapToPoint]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy, dx } = gestureState;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          return false;
        }
        
        const isDraggingDown = dy > MINIMUM_DRAG_DISTANCE;
        const isDraggingUp = dy < -MINIMUM_DRAG_DISTANCE;
        const isAtTop = scrollOffset.current <= 1;
        
        if (isDraggingDown && isAtTop) {
          if (!enablePanDownToClose && currentSnapPointRef.current === 'closed') {
            return false;
          }
          isDraggingSheet.current = true;
          return true;
        }
        
        if (isDraggingUp && isAtTop && currentSnapPointRef.current !== 'full') {
          isDraggingSheet.current = true;
          return true;
        }
        
        return false;
      },
      
      onPanResponderGrant: () => {
        isDraggingSheet.current = true;
        translateY.stopAnimation();
        translateY.extractOffset();
        translateY.setValue(0);
      },
      
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ) as any,
      
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        isDraggingSheet.current = false;
        
        const { vy } = gestureState;
        const currentPosition = (translateY as any)._value;
        
        let targetSnapPoint: SnapPoint = currentSnapPointRef.current;
        
        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          if (vy < 0) {
            targetSnapPoint = currentSnapPointRef.current === 'closed' ? 'half' : 'full';
          } else {
            if (!enablePanDownToClose && currentSnapPointRef.current === 'half') {
              targetSnapPoint = 'half';
            } else {
              targetSnapPoint = currentSnapPointRef.current === 'full' ? 'half' : 'closed';
            }
          }
        } else {
          const distances = {
            closed: Math.abs(currentPosition - (SCREEN_HEIGHT - snapPoints.closed)),
            half: Math.abs(currentPosition - (SCREEN_HEIGHT - snapPoints.half)),
            full: Math.abs(currentPosition - (SCREEN_HEIGHT - snapPoints.full)),
          };
          
          let closest: SnapPoint = 'half';
          let minDistance = Infinity;
          
          (Object.keys(distances) as SnapPoint[]).forEach((point) => {
            if (distances[point] < minDistance) {
              if (point === 'closed' && !enablePanDownToClose && currentSnapPointRef.current === 'half') {
                return;
              }
              minDistance = distances[point];
              closest = point;
            }
          });
          
          targetSnapPoint = closest;
        }
        
        snapToPoint(targetSnapPoint);
      },
      
      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        isDraggingSheet.current = false;
        snapToPoint(currentSnapPointRef.current);
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
        scrollEnabled={scrollEnabledRef.current && !isDraggingSheet.current}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollBeginDrag={() => {
          isDraggingSheet.current = false;
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
    ...Platform.select({
      android: {
        elevation: 8,
      },
    }),
  },
  handleContainer: {
    paddingVertical: DesignTokens.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    minHeight: 44,
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
