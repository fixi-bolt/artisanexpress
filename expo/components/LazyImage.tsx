import React, { useState, useCallback, memo } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

interface LazyImageProps extends ImageProps {
  placeholderColor?: string;
  containerStyle?: ViewStyle;
}

export const LazyImage = memo(({ 
  style, 
  placeholderColor = Colors.borderLight,
  containerStyle,
  ...props 
}: LazyImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  return (
    <View style={[styles.container, containerStyle, style]}>
      {loading && (
        <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" color={Colors.textLight} />
        </View>
      )}
      {!error && (
        <Image
          {...props}
          style={[style, loading && styles.hidden]}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
      {error && (
        <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
          <View style={styles.errorIcon}>
            <View style={styles.errorText} />
          </View>
        </View>
      )}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    width: 20,
    height: 2,
    backgroundColor: Colors.error,
  },
});
