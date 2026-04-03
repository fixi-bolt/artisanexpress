import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
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
  const watchIdRef = useRef<number | Location.LocationSubscription | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestPermission = async () => {
      try {
        console.log('[useGeolocation] Requesting location permission...');

        if (Platform.OS === 'web') {
          // Best-effort permission detection on web
          try {
            const permStatus = await (navigator as any).permissions?.query?.({ name: 'geolocation' as any });
            const granted = permStatus?.state === 'granted' || permStatus?.state === 'prompt' || permStatus == null;
            if (!isMounted) return;
            setHasPermission(granted);
            if (!granted) {
              const err = new Error('Permission to access location was denied');
              setError(err);
              setIsLoading(false);
              onError?.(err);
              console.error('[useGeolocation] Permission denied (web)');
            }
          } catch {
            // Fallback: attempt to use geolocation, browser will prompt
            setHasPermission(true);
          }
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (status !== 'granted') {
          const err = new Error('Permission to access location was denied');
          setError(err);
          setHasPermission(false);
          setIsLoading(false);
          onError?.(err);
          console.error('[useGeolocation] Permission denied (native)');
          return;
        }

        console.log('[useGeolocation] Permission granted');
        setHasPermission(true);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const e = err instanceof Error ? err : new Error('Failed to request location permission');
        setError(e);
        setIsLoading(false);
        onError?.(e);
        console.error('[useGeolocation] Error requesting permission:', e);
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
  }, [enabled, onError]);

  useEffect(() => {
    if (!enabled || !hasPermission) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const startTrackingWeb = () => {
      if (!('geolocation' in navigator)) {
        const err = new Error('Geolocation API not available');
        setError(err);
        setIsLoading(false);
        onError?.(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (loc) => {
          if (!isMounted) return;
          const newPosition: GeolocationPosition = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? null,
            timestamp: loc.timestamp,
          };
          console.log('[useGeolocation] Initial position (web):', newPosition);
          setPosition(newPosition);
          setIsLoading(false);
          onLocationUpdate?.(newPosition);
        },
        (err) => {
          if (!isMounted) return;
          const e = new Error(err.message);
          setError(e);
          setIsLoading(false);
          onError?.(e);
          console.error('[useGeolocation] Error getting position (web):', e);
        },
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 10000 }
      );

      const id = navigator.geolocation.watchPosition(
        (loc) => {
          if (!isMounted) return;
          const updatedPosition: GeolocationPosition = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? null,
            timestamp: loc.timestamp,
          };
          console.log('[useGeolocation] Position updated (web):', updatedPosition);
          setPosition(updatedPosition);
          onLocationUpdate?.(updatedPosition);
        },
        (err) => {
          if (!isMounted) return;
          const e = new Error(err.message);
          setError(e);
          onError?.(e);
          console.error('[useGeolocation] Watch error (web):', e);
        },
        { enableHighAccuracy: false, maximumAge: updateInterval, timeout: 10000 }
      );

      watchIdRef.current = id;
    };

    const startTrackingNative = async () => {
      try {
        console.log('[useGeolocation] Starting location tracking (native)...');

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

        console.log('[useGeolocation] Initial position (native):', newPosition);
        setPosition(newPosition);
        setIsLoading(false);
        onLocationUpdate?.(newPosition);

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: updateInterval,
            distanceInterval: 100,
          },
          (loc) => {
            if (!isMounted) return;

            const updatedPosition: GeolocationPosition = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
              timestamp: loc.timestamp,
            };

            console.log('[useGeolocation] Position updated (native):', updatedPosition);
            setPosition(updatedPosition);
            onLocationUpdate?.(updatedPosition);
          }
        );

        watchIdRef.current = subscription;
      } catch (err) {
        if (!isMounted) return;
        const e = err instanceof Error ? err : new Error('Failed to get location');
        setError(e);
        setIsLoading(false);
        onError?.(e);
        console.error('[useGeolocation] Error tracking location (native):', e);
      }
    };

    if (Platform.OS === 'web') {
      startTrackingWeb();
    } else {
      startTrackingNative();
    }

    return () => {
      isMounted = false;
      if (Platform.OS === 'web') {
        if (typeof watchIdRef.current === 'number') {
          console.log('[useGeolocation] Stopping location tracking (web)');
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      } else {
        const sub = watchIdRef.current as Location.LocationSubscription | null;
        if (sub) {
          console.log('[useGeolocation] Stopping location tracking (native)');
          sub.remove();
        }
      }
      watchIdRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, hasPermission, updateInterval, onLocationUpdate, onError]);

  return {
    position,
    error,
    isLoading,
    hasPermission,
  };
}
