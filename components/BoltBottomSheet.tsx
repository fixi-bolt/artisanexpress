import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Platform,
  Pressable,
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
  enableBackdrop?: boolean;
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
  enableBackdrop = true,
}: BoltBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(
    new Animated.Value(SCREEN_HEIGHT - snapPoints[initialSnapPoint])
  ).current;
  
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint>(initialSnapPoint);
  const currentSnapPointRef = useRef<SnapPoint>(initialSnapPoint);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const scrollContentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  const isDraggingSheet = useRef(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  
  // Track if content is scrollable
  const isContentScrollable = useRef(false);
  
  // Use ref for snapPoints to avoid stale closures
  const snapPointsRef = useRef(snapPoints);
  useEffect(() => {
    snapPointsRef.current = snapPoints;
  }, [snapPoints]);

  const snapToPoint = useCallback(
    (snapPoint: SnapPoint, animated = true) => {
      const targetY = SCREEN_HEIGHT - snapPointsRef.current[snapPoint];
      setCurrentSnapPoint(snapPoint);
      currentSnapPointRef.current = snapPoint;

      const progress = snapPoint === 'full' ? 1 : snapPoint === 'half' ? 0.5 : 0;

      if (!animated) {
        translateY.setValue(targetY);
        onSnapPointChange?.(snapPoint, progress);
        return;
      }

      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        damping: 18,
        mass: 0.9,
        stiffness: 90,
      }).start(() => {
        onSnapPointChange?.(snapPoint, progress);
      });
    },
    [translateY, onSnapPointChange]
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
        
        // Ignorer les gestes horizontaux
        if (Math.abs(dx) > Math.abs(dy)) return false;

        const isDraggingDown = dy > MINIMUM_DRAG_DISTANCE;
        const isDraggingUp = dy < -MINIMUM_DRAG_DISTANCE;
        const isAtTop = scrollOffset.current <= 1;
        
        // Check if we're at the bottom of the scroll
        const isAtBottom = scrollContentHeight.current > 0 && scrollViewHeight.current > 0
          ? scrollOffset.current >= (scrollContentHeight.current - scrollViewHeight.current - 1)
          : false;

        // 1. Toujours permettre le drag vers le bas quand on est en haut
        if (isDraggingDown && isAtTop) {
          if (!enablePanDownToClose && currentSnapPointRef.current === 'closed') return false;
          return true;
        }

        // 2. Permettre le drag vers le haut dans ces cas :
        // - Quand on est en haut (peu importe la position actuelle)
        // - OU quand on est en bas du contenu scrollable
        if (isDraggingUp) {
          if (isAtTop) {
            return true; // CORRECTION : Permettre le drag vers le haut même en position 'full'
          }
          if (isAtBottom && isContentScrollable.current) {
            return true;
          }
        }

        return false;
      },

      onPanResponderGrant: () => {
        isDraggingSheet.current = true;
        setScrollEnabled(false);
        translateY.stopAnimation((currentValue) => {
          translateY.setOffset(currentValue);
          translateY.setValue(0);
        });
      },

      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ) as any,

      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        const { vy } = gestureState;
        let currentPosition = 0;
        translateY.stopAnimation((value) => {
          currentPosition = value;
        });

        let targetSnapPoint: SnapPoint = currentSnapPointRef.current;

        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          if (vy < 0) {
            targetSnapPoint =
              currentSnapPointRef.current === 'closed' ? 'half' : 'full';
          } else {
            if (!enablePanDownToClose && currentSnapPointRef.current === 'half') {
              targetSnapPoint = 'half';
            } else {
              targetSnapPoint =
                currentSnapPointRef.current === 'full' ? 'half' : 'closed';
            }
          }
        } else {
          const distances = {
            closed: Math.abs(currentPosition - (SCREEN_HEIGHT - snapPointsRef.current.closed)),
            half: Math.abs(currentPosition - (SCREEN_HEIGHT - snapPointsRef.current.half)),
            full: Math.abs(currentPosition - (SCREEN_HEIGHT - snapPointsRef.current.full)),
          };

          let closest: SnapPoint = 'half';
          let minDistance = Infinity;

          (Object.keys(distances) as SnapPoint[]).forEach((point) => {
            if (distances[point] < minDistance) {
              if (point === 'closed' && !enablePanDownToClose && currentSnapPointRef.current === 'half') return;
              minDistance = distances[point];
              closest = point;
            }
          });

          targetSnapPoint = closest;
        }

        snapToPoint(targetSnapPoint);
        
        // Re-enable scroll immediately after snap
        isDraggingSheet.current = false;
        setScrollEnabled(true);
      },

      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        isDraggingSheet.current = false;
        setScrollEnabled(true);
        snapToPoint(currentSnapPointRef.current);
      },
    })
  ).current;

  // Handle scroll events
  const handleScroll = useCallback(
    (event: any) => {
      scrollOffset.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  // Track content size to determine if scrollable
  const handleContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      scrollContentHeight.current = contentHeight;
      isContentScrollable.current = contentHeight > scrollViewHeight.current;
    },
    []
  );

  // Track layout of ScrollView
  const handleScrollViewLayout = useCallback(
    (event: any) => {
      const { height } = event.nativeEvent.layout;
      scrollViewHeight.current = height;
      isContentScrollable.current = scrollContentHeight.current > height;
    },
    []
  );

  // Animated overlay opacity
  const overlayOpacity = translateY.interpolate({
    inputRange: [
      SCREEN_HEIGHT - snapPointsRef.current.full,
      SCREEN_HEIGHT - snapPointsRef.current.closed,
    ],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
      {/* Backdrop overlay - only visible when sheet is open */}
      {enableBackdrop && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={() => snapToPoint('closed')}
          pointerEvents={currentSnapPoint === 'closed' ? 'none' : 'auto'}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { 
                backgroundColor: '#000',
                opacity: overlayOpacity,
              }
            ]}
          />
        </Pressable>
      )}

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

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 80, 120) },
          ]}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          bounces={currentSnapPoint === 'full'}
          scrollEnabled={scrollEnabled && (currentSnapPoint === 'full' || currentSnapPoint === 'half')}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleScrollViewLayout}
          onScrollBeginDrag={() => {
            isDraggingSheet.current = false;
          }}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 1,
  },
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
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 8 },
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
    width: 50,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[3],
    backgroundColor: Colors.surface,
  },
  scrollView: { 
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: { 
    flexGrow: 1,
  },
});