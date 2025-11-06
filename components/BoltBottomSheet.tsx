import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { DesignTokens } from '@/constants/design-tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MINIMUM_DRAG_DISTANCE = 5;
const VELOCITY_THRESHOLD = 0.5;
export type SnapPoint = 'closed' | 'half' | 'full';

interface BoltBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: Record<SnapPoint, number>;
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
  const translateYValue = useRef<number>(SCREEN_HEIGHT - snapPoints[initialSnapPoint]);
  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      translateYValue.current = value;
    });
    return () => {
      translateY.removeListener(id);
    };
  }, [translateY]);

  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint>(initialSnapPoint);
  const currentSnapPointRef = useRef<SnapPoint>(initialSnapPoint);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(initialSnapPoint === 'full');
  const isDraggingSheet = useRef(false);
  const panStartY = useRef(0);

  const getYForSnap = useCallback(
    (snap: SnapPoint) => SCREEN_HEIGHT - snapPoints[snap],
    [snapPoints]
  );

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const snapToPoint = useCallback(
    (snapPoint: SnapPoint, animated = true) => {
      const targetY = getYForSnap(snapPoint);
      setCurrentSnapPoint(snapPoint);
      currentSnapPointRef.current = snapPoint;
      setScrollEnabled(snapPoint === 'full');

      const progress = snapPoint === 'full' ? 1 : snapPoint === 'half' ? 0.5 : 0;
      if (!animated) {
        translateY.setValue(targetY);
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
        onSnapPointChange?.(snapPoint, progress);
      });
    },
    [translateY, getYForSnap, onSnapPointChange]
  );

  useEffect(() => {
    const targetY = getYForSnap(initialSnapPoint);
    translateY.setValue(targetY);
    translateYValue.current = targetY;
    setCurrentSnapPoint(initialSnapPoint);
    currentSnapPointRef.current = initialSnapPoint;
    setScrollEnabled(initialSnapPoint === 'full');
  }, [initialSnapPoint, getYForSnap, translateY]);

  const minTranslateY = getYForSnap('full');
  const maxTranslateY = getYForSnap('closed');

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
        const isAtTop = scrollOffset.current <= 0;

        if (isAtTop && (isDraggingDown || isDraggingUp)) {
          if (isDraggingDown && !enablePanDownToClose && currentSnapPointRef.current === 'closed') {
            return false;
          }
          if (isDraggingUp && currentSnapPointRef.current === 'full') {
            return false;
          }
          return true;
        }

        return false;
      },

      onPanResponderGrant: () => {
        isDraggingSheet.current = true;
        setScrollEnabled(false);
        panStartY.current = translateYValue.current;
      },

      onPanResponderMove: (_, gestureState) => {
        const newY = panStartY.current + gestureState.dy;
        const clamped = clamp(newY, minTranslateY, maxTranslateY);
        translateY.setValue(clamped);
      },

      onPanResponderRelease: (_, gestureState) => {
        isDraggingSheet.current = false;

        const { vy } = gestureState;
        const currentPosition = translateYValue.current;

        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          if (vy < 0) {
            if (currentSnapPointRef.current === 'closed') {
              snapToPoint('half');
            } else {
              snapToPoint('full');
            }
          } else {
            if (!enablePanDownToClose && currentSnapPointRef.current === 'half') {
              snapToPoint('half');
            } else {
              if (currentSnapPointRef.current === 'full') {
                snapToPoint('half');
              } else {
                snapToPoint('closed');
              }
            }
          }
          return;
        }

        const targets: Record<SnapPoint, number> = {
          closed: getYForSnap('closed'),
          half: getYForSnap('half'),
          full: getYForSnap('full'),
        };

        let closest: SnapPoint = 'half';
        let minDistance = Infinity;

        (Object.keys(targets) as SnapPoint[]).forEach((point) => {
          if (point === 'closed' && !enablePanDownToClose && currentSnapPointRef.current === 'half') {
            return;
          }
          const d = Math.abs(currentPosition - targets[point]);
          if (d < minDistance) {
            minDistance = d;
            closest = point;
          }
        });

        snapToPoint(closest);
      },

      onPanResponderTerminate: () => {
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
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={currentSnapPoint === 'full'}
        scrollEnabled={scrollEnabled && !isDraggingSheet.current}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
