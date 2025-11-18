import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Bell, MapPin, Clock, Euro, Navigation, Image as ImageIcon, Satellite, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions } from '@/contexts/MissionContext';
import { Mission } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface NearbyMission {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  estimatedPrice: number;
  address: string;
  clientId: string;
  clientName: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photos: string[];
  distanceKm: number;
  createdAt: Date;
}

export default function ArtisanDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { getPendingMissionsForArtisan, acceptMission, unreadNotificationsCount } = useMissions();
  const nearbyMissions: NearbyMission[] = [];
  const isLoadingMissions = false;
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  
  const pendingMissions = getPendingMissionsForArtisan();

  useEffect(() => {
    if (user?.type === 'artisan') {
      setIsAvailable(Boolean((user as import('@/types').Artisan).isAvailable));
    }
  }, [user]);

  const handleLocationUpdate = useCallback(
    async (position: { latitude: number; longitude: number; accuracy: number | null }) => {
      if (!user?.id) return;

      console.log('[Dashboard] Location received:', position);
      console.log('[Dashboard] Location tracking active (backend features disabled)');
    },
    [user?.id]
  );

  const handleLocationError = useCallback((error: Error) => {
    console.error('[Dashboard] Location error:', error);
    Alert.alert(
      'Erreur de localisation',
      'Impossible d\'accéder à votre position. Les missions à proximité ne seront pas disponibles.',
      [{ text: 'OK' }]
    );
  }, []);

  const { position, hasPermission } = useGeolocation({
    enabled: true,
    updateInterval: 30000,
    onLocationUpdate: handleLocationUpdate,
    onError: handleLocationError,
  });

  const handleAcceptMission = (missionId: string) => {
    Alert.alert(
      'Accepter la mission',
      'Voulez-vous accepter cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              console.log('🎯 Starting mission acceptance:', missionId);
              await acceptMission(missionId, user?.id || '');
              console.log('✅ Mission accepted successfully:', missionId);
              Alert.alert('Mission acceptée !', 'Le client a été notifié. Rendez-vous chez lui.');
            } catch (error) {
              console.error('❌ Error accepting mission:', error);
              Alert.alert('Erreur', 'Impossible d\'accepter la mission. Réessayez.');
            }
          },
        },
      ]
    );
  };

  const statusColor = useMemo(() => (isAvailable ? Colors.success : Colors.error), [isAvailable]);

  const onToggleAvailability = useCallback(async (value: boolean) => {
    if (user?.type !== 'artisan') return;
    console.log('[Dashboard] Toggling availability to:', value);
    setIsToggling(true);
    const prev = isAvailable;
    setIsAvailable(value);
    try {
      await updateUser({ isAvailable: value } as Partial<import('@/types').Artisan>);
      console.log('[Dashboard] Availability updated successfully');
    } catch (e: any) {
      console.error('[Dashboard] Failed to update availability:', e?.message);
      setIsAvailable(prev);
      Alert.alert('Erreur', "Impossible de mettre à jour votre disponibilité. Réessayez.");
    } finally {
      setIsToggling(false);
    }
  }, [user?.type, isAvailable, updateUser]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.userName}>{user?.name || 'Artisan'}</Text>
        </View>
        <Link href="/notifications" asChild>
          <TouchableOpacity 
            style={styles.notificationButton} 
            activeOpacity={0.7}
          >
            <Bell size={24} color={Colors.text} strokeWidth={2} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {hasPermission && position && (
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Satellite size={20} color={Colors.secondary} strokeWidth={2} />
              <Text style={styles.locationTitle}>Position GPS active</Text>
            </View>
            <Text style={styles.locationText}>
              📍 Lat: {position.latitude.toFixed(4)}, Lng: {position.longitude.toFixed(4)}
            </Text>
            {position.accuracy && (
              <Text style={styles.locationAccuracy}>Précision: ±{Math.round(position.accuracy)}m</Text>
            )}
          </View>
        )}

        {!hasPermission && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionEmoji}>📍</Text>
            <Text style={styles.permissionTitle}>Localisation désactivée</Text>
            <Text style={styles.permissionText}>
              Activez la localisation pour voir les missions à proximité
            </Text>
          </View>
        )}

        <View style={styles.statusCard} testID="status-card">
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Statut</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]} testID="availability-text">{isAvailable ? 'Disponible' : 'Indisponible'}</Text>
            </View>
          </View>
          <View style={styles.toggleContainer} testID="availability-toggle">
            <Switch
              value={isAvailable}
              onValueChange={onToggleAvailability}
              disabled={isToggling}
              thumbColor={isAvailable ? Colors.surface : Colors.surface}
              trackColor={{ false: Colors.borderLight, true: Colors.success + '70' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Missions à proximité
            </Text>
            {isLoadingMissions && <ActivityIndicator size="small" color={Colors.secondary} />}
            {!isLoadingMissions && nearbyMissions.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{nearbyMissions.length}</Text>
              </View>
            )}
          </View>

          {nearbyMissions.length === 0 && !isLoadingMissions ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Aucune mission à proximité</Text>
              <Text style={styles.emptyText}>
                Les missions dans votre rayon d&apos;intervention apparaîtront ici
              </Text>
            </View>
          ) : (
            nearbyMissions.map((mission) => (
              <NearbyMissionCard
                key={mission.id}
                mission={mission}
                onAccept={() => handleAcceptMission(mission.id)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Toutes les demandes
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pendingMissions.length}</Text>
            </View>
          </View>

          {pendingMissions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>Aucune demande</Text>
              <Text style={styles.emptyText}>
                Les nouvelles demandes apparaîtront ici
              </Text>
            </View>
          ) : (
            pendingMissions.map((mission) => (
              <MissionRequestCard
                key={mission.id}
                mission={mission}
                onAccept={() => handleAcceptMission(mission.id)}
              />
            ))
          )}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Conseils</Text>
          <Text style={styles.tipsText}>
            • Acceptez rapidement les missions pour augmenter vos chances{'\n'}
            • Maintenez une note élevée pour plus de visibilité{'\n'}
            • Soyez ponctuel pour obtenir de meilleures notes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function NearbyMissionCard({ mission, onAccept }: { mission: NearbyMission; onAccept: () => void }) {
  const timeAgo = Math.floor((Date.now() - new Date(mission.createdAt).getTime()) / 60000);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <>
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTimeContainer}>
          <Clock size={14} color={Colors.secondary} strokeWidth={2} />
          <Text style={styles.requestTime}>Il y a {timeAgo} min</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Navigation size={12} color={Colors.surface} strokeWidth={2} />
          <Text style={styles.distanceText}>{mission.distanceKm.toFixed(1)} km</Text>
        </View>
      </View>

      <Text style={styles.requestTitle}>{mission.title}</Text>
      <Text style={styles.requestDescription} numberOfLines={2}>
        {mission.description}
      </Text>

      <View style={styles.requestDetails}>
        <View style={styles.requestDetail}>
          <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.requestDetailText} numberOfLines={1}>
            {mission.address?.split(',')[0] || 'Adresse non spécifiée'}
          </Text>
        </View>
        {mission.photos && mission.photos.length > 0 && (
          <View style={styles.requestDetail}>
            <ImageIcon size={16} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.requestDetailText}>
              {mission.photos.length} photo{mission.photos.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.priceContainer}>
          <Euro size={18} color={Colors.success} strokeWidth={2} />
          <Text style={styles.priceValue}>{mission.estimatedPrice}€</Text>
        </View>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>
      </View>

      {mission.photos && mission.photos.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {mission.photos.map((photo, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.photoThumbnail}
              onPress={() => setSelectedPhoto(photo)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: photo }} 
                style={styles.photoThumbnailImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>

    <Modal
      visible={selectedPhoto !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedPhoto(null)}
    >
      <View style={styles.photoModal}>
        <TouchableOpacity
          style={styles.photoModalClose}
          onPress={() => setSelectedPhoto(null)}
          activeOpacity={0.9}
        >
          <X size={24} color={Colors.surface} strokeWidth={2} />
        </TouchableOpacity>
        {selectedPhoto && (
          <Image
            source={{ uri: selectedPhoto }}
            style={styles.photoModalImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
    </>
  );
}

function MissionRequestCard({ mission, onAccept }: { mission: Mission; onAccept: () => void }) {
  const timeAgo = Math.floor((Date.now() - mission.createdAt.getTime()) / 60000);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <>
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTimeContainer}>
          <Clock size={14} color={Colors.secondary} strokeWidth={2} />
          <Text style={styles.requestTime}>Il y a {timeAgo} min</Text>
        </View>
        <View style={styles.urgencyBadge}>
          <Text style={styles.urgencyText}>URGENT</Text>
        </View>
      </View>

      <Text style={styles.requestTitle}>{mission.title}</Text>
      <Text style={styles.requestDescription} numberOfLines={2}>
        {mission.description}
      </Text>

      <View style={styles.requestDetails}>
        <View style={styles.requestDetail}>
          <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.requestDetailText} numberOfLines={1}>
            {mission.location.address?.split(',')[0]}
          </Text>
        </View>
        {mission.photos && mission.photos.length > 0 && (
          <View style={styles.requestDetail}>
            <ImageIcon size={16} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.requestDetailText}>
              {mission.photos.length} photo{mission.photos.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.priceContainer}>
          <Euro size={18} color={Colors.success} strokeWidth={2} />
          <Text style={styles.priceValue}>{mission.estimatedPrice}€</Text>
        </View>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>
      </View>

      {mission.photos && mission.photos.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {mission.photos.map((photo, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.photoThumbnail}
              onPress={() => setSelectedPhoto(photo)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: photo }} 
                style={styles.photoThumbnailImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>

    <Modal
      visible={selectedPhoto !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedPhoto(null)}
    >
      <View style={styles.photoModal}>
        <TouchableOpacity
          style={styles.photoModalClose}
          onPress={() => setSelectedPhoto(null)}
          activeOpacity={0.9}
        >
          <X size={24} color={Colors.surface} strokeWidth={2} />
        </TouchableOpacity>
        {selectedPhoto && (
          <Image
            source={{ uri: selectedPhoto }}
            style={styles.photoModalImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.success + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  toggleContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.secondary + '30',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  urgencyBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  requestDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '40%',
  },
  requestDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.success,
  },
  acceptButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: Colors.info + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  locationCard: {
    backgroundColor: Colors.secondary + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  permissionCard: {
    backgroundColor: Colors.warning + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  permissionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  distanceBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  photosScroll: {
    marginTop: 12,
    marginBottom: 8,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  photoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoModalImage: {
    width: '90%',
    height: '80%',
  },
});
