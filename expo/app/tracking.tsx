import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Phone, MessageCircle, Star, Navigation, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMissions } from '@/contexts/MissionContext';
import { mockArtisans } from '@/mocks/artisans';
import { MapView, Marker } from '@/components/MapView';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeMission, startMission, completeMission } = useMissions();
  const [isMounted, setIsMounted] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (!activeMission) {
      const timer = setTimeout(() => {
        router.replace('/(client)/home' as any);
      }, 100);
      return () => clearTimeout(timer);
    }

    Animated.sequence([
      Animated.delay(300),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [activeMission, router, pulseAnim, slideAnim, isMounted]);

  if (!activeMission) {
    return null;
  }

  const artisan = mockArtisans.find(a => a.id === activeMission.artisanId);
  const status = activeMission.status;
  const eta = activeMission.eta || 15;

  const getStatusInfo = () => {
    switch (status) {
      case 'accepted':
        return {
          title: 'Artisan en route',
          subtitle: `Arrivée estimée dans ${eta} minutes`,
          icon: '🚗',
          action: 'Confirmer l\'arrivée',
        };
      case 'in_progress':
        return {
          title: 'Intervention en cours',
          subtitle: 'L\'artisan travaille sur votre demande',
          icon: '🔧',
          action: 'Terminer l\'intervention',
        };
      default:
        return {
          title: 'Mission en cours',
          subtitle: 'Traitement de votre demande',
          icon: '⏳',
          action: undefined,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.mapContainer, { paddingTop: insets.top }]}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: activeMission.artisanLocation?.latitude || activeMission.location.latitude,
              longitude: activeMission.artisanLocation?.longitude || activeMission.location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            testID="tracking-map"
          >
            {/* Marqueur de destination (client) */}
            <Marker
              coordinate={{
                latitude: activeMission.location.latitude,
                longitude: activeMission.location.longitude,
              }}
              title="Votre adresse"
              description={activeMission.location.address}
            />
            
            {/* Marqueur de l'artisan (si position disponible) */}
            {activeMission.artisanLocation && (
              <Marker
                coordinate={{
                  latitude: activeMission.artisanLocation.latitude,
                  longitude: activeMission.artisanLocation.longitude,
                }}
                title="Artisan"
                description={artisan?.name || 'En route'}
              />
            )}
          </MapView>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <X size={24} color={Colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.statusCard}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{statusInfo.title}</Text>
              <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
            </View>
          </View>

          {status === 'accepted' && (
            <View style={styles.etaCard}>
              <Clock size={20} color={Colors.secondary} strokeWidth={2} />
              <Text style={styles.etaText}>
                <Text style={styles.etaBold}>{eta} min</Text> · Arrivée vers{' '}
                {new Date(Date.now() + eta * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}

          {artisan && (
            <View style={styles.artisanCard}>
              <View style={styles.artisanHeader}>
                <View style={styles.artisanAvatar}>
                  <Text style={styles.artisanAvatarText}>
                    {artisan.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.artisanInfo}>
                  <Text style={styles.artisanName}>{artisan.name}</Text>
                  <View style={styles.artisanMeta}>
                    <Star size={14} color={Colors.warning} fill={Colors.warning} strokeWidth={0} />
                    <Text style={styles.artisanRating}>
                      {artisan.rating} · {artisan.completedMissions} missions
                    </Text>
                  </View>
                </View>
                <View style={styles.artisanActions}>
                  <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                    <Phone size={20} color={Colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/chat?missionId=${activeMission.id}` as any)}
                  >
                    <MessageCircle size={20} color={Colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.artisanSpecialties}>
                {artisan.specialties.slice(0, 3).map((specialty, index) => (
                  <View key={index} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{activeMission.title}</Text>
            <Text style={styles.missionDescription} numberOfLines={2}>
              {activeMission.description}
            </Text>
            <View style={styles.missionMeta}>
              <Navigation size={16} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.missionMetaText} numberOfLines={1}>
                {activeMission.location.address}
              </Text>
            </View>
          </View>

          {statusInfo.action && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                if (status === 'accepted') {
                  startMission(activeMission.id);
                  console.log('Mission started');
                } else if (status === 'in_progress') {
                  Alert.alert(
                    'Terminer l\'intervention',
                    'Entrez le montant final de l\'intervention',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Valider',
                        onPress: () => {
                          const finalPrice = activeMission.estimatedPrice * 1.1;
                          completeMission(activeMission.id, finalPrice);
                          console.log('Mission completed, redirecting to payment');
                          router.push(`/payment?missionId=${activeMission.id}` as any);
                        },
                      },
                    ]
                  );
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {statusInfo.action}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  etaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  etaBold: {
    fontWeight: '700' as const,
    color: Colors.secondary,
    fontSize: 16,
  },
  artisanCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  artisanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  artisanAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artisanAvatarText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  artisanInfo: {
    flex: 1,
  },
  artisanName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  artisanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artisanRating: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  artisanActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artisanSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  missionCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  missionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missionMetaText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
