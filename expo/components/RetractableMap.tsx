import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { MapPin, ChevronUp, ChevronDown } from 'lucide-react-native';
import { MapView, Marker } from '@/components/MapView';
import { DesignTokens, AppColors } from '@/constants/design-tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const COLLAPSED_HEIGHT = 120;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6;

interface RetractableMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  markers?: {
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  }[];
  showUserLocation?: boolean;
  onRegionChange?: (region: any) => void;
  testID?: string;
}

export default function RetractableMap({
  latitude,
  longitude,
  address,
  markers = [],
  showUserLocation = true,
  onRegionChange,
  testID = 'retractable-map',
}: RetractableMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0 && !isExpanded) {
          const newHeight = COLLAPSED_HEIGHT - gestureState.dy;
          if (newHeight <= EXPANDED_HEIGHT) {
            animatedHeight.setValue(newHeight);
          }
        } else if (gestureState.dy > 0 && isExpanded) {
          const newHeight = EXPANDED_HEIGHT - gestureState.dy;
          if (newHeight >= COLLAPSED_HEIGHT) {
            animatedHeight.setValue(newHeight);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isExpanded && gestureState.dy < -50) {
          expandMap();
        } else if (isExpanded && gestureState.dy > 50) {
          collapseMap();
        } else {
          Animated.spring(animatedHeight, {
            toValue: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
            useNativeDriver: false,
            tension: 50,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const expandMap = () => {
    setIsExpanded(true);
    Animated.spring(animatedHeight, {
      toValue: EXPANDED_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  };

  const collapseMap = () => {
    setIsExpanded(false);
    Animated.spring(animatedHeight, {
      toValue: COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  };

  const toggleMap = () => {
    if (isExpanded) {
      collapseMap();
    } else {
      expandMap();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animatedHeight,
        },
      ]}
      testID={testID}
    >
      <View
        style={styles.handleContainer}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          style={styles.handleButton}
          onPress={toggleMap}
          activeOpacity={0.7}
          testID={`${testID}-toggle`}
        >
          <View style={styles.handle} />
          {isExpanded ? (
            <ChevronDown size={20} color={AppColors.text.secondary} strokeWidth={2} />
          ) : (
            <ChevronUp size={20} color={AppColors.text.secondary} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {!isExpanded && (
        <TouchableOpacity
          style={styles.collapsedContent}
          onPress={expandMap}
          activeOpacity={0.9}
          testID={`${testID}-collapsed-content`}
        >
          <View style={styles.addressContainer}>
            <MapPin size={20} color={AppColors.primary} strokeWidth={2} />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>Adresse d&apos;intervention</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>
          <Text style={styles.tapToExpand}>Appuyez pour voir la carte</Text>
        </TouchableOpacity>
      )}

      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={isExpanded}
        showsCompass={isExpanded}
        scrollEnabled={isExpanded}
        zoomEnabled={isExpanded}
        rotateEnabled={isExpanded}
        onRegionChangeComplete={onRegionChange}
        testID={`${testID}-view`}
      >
        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
          title="Position principale"
          description={address}
        />

        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </MapView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.surface,
    borderRadius: DesignTokens.borderRadius.xl,
    overflow: 'hidden',
    ...DesignTokens.shadows.lg,
    borderWidth: 1,
    borderColor: AppColors.border.light,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing[2],
    backgroundColor: AppColors.surface,
    zIndex: 10,
  },
  handleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing[2],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.border.default,
    borderRadius: 2,
    marginBottom: DesignTokens.spacing[2],
  },
  collapsedContent: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.surface,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    zIndex: 5,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[2],
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.text.secondary,
    marginBottom: DesignTokens.spacing[1],
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  addressText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: AppColors.text.primary,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    lineHeight: DesignTokens.typography.fontSize.sm * 1.4,
  },
  tapToExpand: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: AppColors.primary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing[2],
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    top: 48,
  },
});
