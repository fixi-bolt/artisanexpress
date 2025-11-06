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
const MINIMUM_DRAG_DISTANCE = 10;
const VELOCITY_THRESHOLD = 0.5;

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
  backdropComponent?: React.ReactNode;
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
  const translateY = useRef(
    new Animated.Value(SCREEN_HEIGHT - snapPoints[initialSnapPoint])
  ).current;
  
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint>(initialSnapPoint);
  const currentSnapPointRef = useRef<SnapPoint>(initialSnapPoint);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const scrollContentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  
  // Track if we're currently dragging the sheet
  const isDraggingSheet = useRef(false);
  
  // Track if content is scrollable
  const isContentScrollable = useRef(false);

  const snapToPoint = useCallback(
    (snapPoint: SnapPoint, animated = true) => {
      const targetY = SCREEN_HEIGHT - snapPoints[snapPoint];
      
      setCurrentSnapPoint(snapPoint);
      currentSnapPointRef.current = snapPoint;
      
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

  // Update snap point if initialSnapPoint changes
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
        
        // Ignore horizontal swipes
        if (Math.abs(dx) > Math.abs(dy)) {
          return false;
        }
        
        const isDraggingDown = dy > MINIMUM_DRAG_DISTANCE;
        const isDraggingUp = dy < -MINIMUM_DRAG_DISTANCE;
        const isAtTop = scrollOffset.current <= 1; // Tolerance de 1px
        
        // Check if we're at the bottom of the scroll
        const isAtBottom = scrollContentHeight.current > 0 && scrollViewHeight.current > 0
          ? scrollOffset.current >= (scrollContentHeight.current - scrollViewHeight.current - 1)
          : false;
        
        // Allow dragging down ONLY if:
        // 1. We're at the top of the scroll content (to prevent conflict with scrolling)
        // 2. Pan down to close is enabled OR we're not at the closed position
        if (isDraggingDown && isAtTop) {
          if (!enablePanDownToClose && currentSnapPointRef.current === 'closed') {
            return false;
          }
          isDraggingSheet.current = true;
          return true;
        }
        
        // Allow dragging up ONLY if:
        // 1. We're at the top of the scroll content AND we're not at full
        // OR we're at the bottom of scrollable content
        if (isDraggingUp) {
          // Si on est en haut ET qu'on n'est pas en full, on peut drag le sheet
          if (isAtTop && currentSnapPointRef.current !== 'full') {
            isDraggingSheet.current = true;
            return true;
          }
          // Si on est en bas du contenu scrollable, on peut aussi drag le sheet vers le haut
          if (isAtBottom && currentSnapPointRef.current !== 'full' && isContentScrollable.current) {
            isDraggingSheet.current = true;
            return true;
          }
        }
        
        return false;
      },
      
      onPanResponderGrant: (_, gestureState) => {
        translateY.stopAnimation();
        isDraggingSheet.current = true;
      },
      
      onPanResponderMove: (_, gestureState) => {
        if (!isDraggingSheet.current) return;
        
        const { dy } = gestureState;
        const currentY = SCREEN_HEIGHT - snapPoints[currentSnapPointRef.current];
        const newY = currentY + dy;
        
        // Apply bounds with slight resistance at edges
        const minY = SCREEN_HEIGHT - snapPoints.full;
        const maxY = SCREEN_HEIGHT - snapPoints.closed;
        
        let clampedY = newY;
        
        // Add rubber band effect at boundaries
        if (newY < minY) {
          const diff = minY - newY;
          clampedY = minY - diff * 0.3; // 30% resistance
        } else if (newY > maxY) {
          const diff = newY - maxY;
          clampedY = maxY + diff * 0.3; // 30% resistance
        } else {
          clampedY = newY;
        }
        
        translateY.setValue(clampedY);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        isDraggingSheet.current = false;
        const { dy, vy } = gestureState;
        
        let targetSnapPoint: SnapPoint = currentSnapPointRef.current;
        
        // Determine target based on velocity first (fast flick)
        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          if (vy < 0) {
            // Flicking up
            targetSnapPoint = currentSnapPointRef.current === 'closed' 
              ? 'half' 
              : 'full';
          } else {
            // Flicking down
            if (!enablePanDownToClose && currentSnapPointRef.current === 'half') {
              targetSnapPoint = 'half';
            } else {
              targetSnapPoint = currentSnapPointRef.current === 'full' 
                ? 'half' 
                : 'closed';
            }
          }
        } 
        // If no significant velocity, use distance traveled
        else {
          const currentY = SCREEN_HEIGHT - snapPoints[currentSnapPointRef.current];
          const finalY = currentY + dy;
          
          // Calculate which snap point we're closest to
          const distances = {
            closed: Math.abs(finalY - (SCREEN_HEIGHT - snapPoints.closed)),
            half: Math.abs(finalY - (SCREEN_HEIGHT - snapPoints.half)),
            full: Math.abs(finalY - (SCREEN_HEIGHT - snapPoints.full)),
          };
          
          // Find the closest snap point
          let closest: SnapPoint = 'half';
          let minDistance = Infinity;
          
          (Object.keys(distances) as SnapPoint[]).forEach((point) => {
            if (distances[point] < minDistance) {
              // Don't snap to closed if pan down is disabled and we're moving from half
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
        isDraggingSheet.current = false;
        // Snap back to current position if gesture is interrupted
        snapToPoint(currentSnapPointRef.current);
      },
    })
  ).current;

  // Handle scroll events
  const handleScroll = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      scrollOffset.current = offsetY;
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

      {headerComponent && (
        <View style={styles.header}>{headerComponent as any}</View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        // CRITIQUE : Toujours permettre le bounce pour une UX fluide
        bounces={true}
        // CRITIQUE : Le scroll est toujours activé, peu importe la position du sheet
        scrollEnabled={!isDraggingSheet.current}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleScrollViewLayout}
        onScrollBeginDrag={() => {
          // Ensure we're not trying to drag the sheet while scrolling
          isDraggingSheet.current = false;
        }}
        // CRITIQUE : Désactiver le nestedScrollEnabled sur Android pour éviter les conflits
        nestedScrollEnabled={false}
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
    // Prevent touch events from passing through on Android
    ...Platform.select({
      android: {
        elevation: 5,
      },
    }),
  },
  handleContainer: {
    paddingVertical: DesignTokens.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    // Make the handle area larger for easier dragging
    minHeight: 40,
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