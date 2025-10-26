import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface UseGeolocationOptions {
  enabled?: boolean;
  updateInterval?: number;
  onLocationUpdate?: (position: GeolocationPosition) => void;
  onError?: (error: Error) => void;
}

export function useGeolocation({
  enabled = true,
  updateInterval = 30000,
  onLocationUpdate,
  onError,
}: UseGeolocationOptions = {}) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const watchIdRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestPermission = async () => {
      try {
        console.log('[useGeolocation] Requesting location permission...');
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (!isMounted) return;

        if (status !== 'granted') {
          const error = new Error('Permission to access location was denied');
          setError(error);
          setHasPermission(false);
          setIsLoading(false);
          onError?.(error);
          console.error('[useGeolocation] Permission denied');
          return;
        }

        console.log('[useGeolocation] Permission granted');
        setHasPermission(true);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error('Failed to request location permission');
        setError(error);
        setIsLoading(false);
        onError?.(error);
        console.error('[useGeolocation] Error requesting permission:', error);
      }
    };

    if (enabled) {
      requestPermission();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !hasPermission) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const startTracking = async () => {
      try {
        console.log('[useGeolocation] Starting location tracking...');
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

        const newPosition: GeolocationPosition = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        };

        console.log('[useGeolocation] Initial position:', newPosition);
        setPosition(newPosition);
        setIsLoading(false);
        onLocationUpdate?.(newPosition);

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: updateInterval,
            distanceInterval: 100,
          },
          (location) => {
            if (!isMounted) return;

            const updatedPosition: GeolocationPosition = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              timestamp: location.timestamp,
            };

            console.log('[useGeolocation] Position updated:', updatedPosition);
            setPosition(updatedPosition);
            onLocationUpdate?.(updatedPosition);
          }
        );

        watchIdRef.current = subscription;

      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error('Failed to get location');
        setError(error);
        setIsLoading(false);
        onError?.(error);
        console.error('[useGeolocation] Error tracking location:', error);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (watchIdRef.current) {
        console.log('[useGeolocation] Stopping location tracking');
        watchIdRef.current.remove();
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, hasPermission, updateInterval]);

  return {
    position,
    error,
    isLoading,
    hasPermission,
  };
}
