import { useRef, useState, useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface UseScrollBehaviorOptions {
  threshold?: number;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
}

export function useScrollBehavior({
  threshold = 50,
  onScrollUp,
  onScrollDown,
}: UseScrollBehaviorOptions = {}) {
  const [isMapVisible, setIsMapVisible] = useState(true);
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const delta = currentScrollY - lastScrollY.current;

      if (Math.abs(delta) < 5) {
        return;
      }

      const newDirection = delta > 0 ? 'down' : 'up';

      if (newDirection !== scrollDirection.current) {
        scrollDirection.current = newDirection;

        if (currentScrollY > threshold) {
          if (newDirection === 'down' && isMapVisible) {
            setIsMapVisible(false);
            onScrollDown?.();
            console.log('[useScrollBehavior] Scrolling down - hiding map');
          } else if (newDirection === 'up' && !isMapVisible) {
            setIsMapVisible(true);
            onScrollUp?.();
            console.log('[useScrollBehavior] Scrolling up - showing map');
          }
        } else if (currentScrollY <= threshold && !isMapVisible) {
          setIsMapVisible(true);
          onScrollUp?.();
          console.log('[useScrollBehavior] Near top - showing map');
        }
      }

      lastScrollY.current = currentScrollY;
      scrollY.current = currentScrollY;
    },
    [threshold, isMapVisible, onScrollDown, onScrollUp]
  );

  return {
    isMapVisible,
    handleScroll,
    scrollY: scrollY.current,
  };
}
