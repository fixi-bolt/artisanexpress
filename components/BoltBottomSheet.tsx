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
const MINIMUM_DRAG_DISTANCE = 5;
const VELOCITY_THRESHOLD = 0.3;

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
  
  // Séparer complètement la gestion des gestes
  const isScrollViewScrolling = useRef(false);
  const lastScrollTimestamp = useRef(0);
  const scrollStartOffset = useRef(0);
  
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

  // Calcul de la hauteur dynamique pour le ScrollView
  const scrollViewHeight = translateY.interpolate({
    inputRange: [
      SCREEN_HEIGHT - snapPointsRef.current.full,
      SCREEN_HEIGHT - snapPointsRef.current.half, 
      SCREEN_HEIGHT - snapPointsRef.current.closed,
    ],
    outputRange: [
      snapPointsRef.current.full - 100, // Hauteur en position full (moins l'espace pour le header/poignée)
      snapPointsRef.current.half - 100,  // Hauteur en position half
      snapPointsRef.current.closed - 80, // Hauteur en position closed
    ],
    extrapolate: 'clamp',
  });

  // CORRECTION : Animated overlay opacity - Overlay seulement quand le bottom sheet est très bas
  const overlayOpacity = translateY.interpolate({
    inputRange: [
      SCREEN_HEIGHT - snapPointsRef.current.full,
      SCREEN_HEIGHT - snapPointsRef.current.half,
      SCREEN_HEIGHT - snapPointsRef.current.closed + 50, // Commencer l'overlay seulement très bas
      SCREEN_HEIGHT - snapPointsRef.current.closed,
    ],
    outputRange: [0, 0, 0.2, 0.5], // Overlay progressif seulement en position très basse
    extrapolate: 'clamp',
  });

  // PanResponder uniquement pour la poignée et les zones non-scrollables
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        
        // Toujours capturer les gestes sur la poignée
        return Math.abs(dy) > MINIMUM_DRAG_DISTANCE;
      },
      
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: () => {
        translateY.stopAnimation((currentValue) => {
          translateY.setOffset(currentValue);
          translateY.setValue(0);
        });
      },

      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        const { vy, dy } = gestureState;
        let currentPosition = 0;
        translateY.stopAnimation((value) => {
          currentPosition = value;
        });

        let targetSnapPoint: SnapPoint = currentSnapPointRef.current;

        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          // Logique basée sur la vélocité
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
          // Logique basée sur la position
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
      },

      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        snapToPoint(currentSnapPointRef.current);
      },
    })
  ).current;

  // Gestion séparée du scroll
  const handleScrollBeginDrag = useCallback(() => {
    isScrollViewScrolling.current = true;
    scrollStartOffset.current = Date.now();
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isScrollViewScrolling.current = false;
    lastScrollTimestamp.current = Date.now();
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    isScrollViewScrolling.current = false;
    lastScrollTimestamp.current = Date.now();
  }, []);

  // PanResponder pour le header (zone non-scrollable)
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        return Math.abs(dy) > MINIMUM_DRAG_DISTANCE;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation((currentValue) => {
          translateY.setOffset(currentValue);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: panResponder.panHandlers.onPanResponderRelease,
    })
  ).current;

  return (
    <>
      {/* Backdrop overlay */}
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
        {/* Zone de poignée - toujours draggable */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        {/* Zone header - draggable aussi */}
        {headerComponent && (
          <View style={styles.header} {...headerPanResponder.panHandlers}>
            {headerComponent}
          </View>
        )}

        {/* ScrollView avec hauteur dynamique */}
        <Animated.ScrollView
          ref={scrollViewRef}
          style={[
            styles.scrollView,
            {
              maxHeight: scrollViewHeight,
            }
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingBottom: Math.max(insets.bottom + 40, 80),
            }
          ]}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          bounces={true}
          scrollEnabled={true}
          alwaysBounceVertical={true}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollBegin={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {children}
        </Animated.ScrollView>
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