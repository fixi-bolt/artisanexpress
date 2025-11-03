import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Clock, CheckCircle, XCircle, Navigation, Euro, Star, 
  Edit3, Trash2, Calendar, MapPin, Package, ArrowLeft, X, Image as ImageIcon
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMissions } from '@/contexts/MissionContext';
import { categories } from '@/mocks/artisans';
import { useCallback, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import RetractableMap from '@/components/RetractableMap';

export default function MissionDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const { missions, cancelMission } = useMissions();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const mission = missions.find(m => m.id === missionId);

  const category = categories.find(c => c.id === mission?.category);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Annuler la mission',
      'Êtes-vous sûr de vouloir annuler cette mission ?',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            if (!mission) return;
            try {
              setIsLoading(true);
              await cancelMission(mission.id);
              Alert.alert('Mission annulée', 'La mission a été annulée avec succès', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('❌ Error cancelling mission:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la mission');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [mission, cancelMission, router]);

  const handleEdit = useCallback(() => {
    if (!mission) return;
    router.push(`/request?edit=${mission.id}` as any);
  }, [mission, router]);

  if (!mission) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: 'Mission introuvable',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        ),
      }} />
        <View style={styles.errorContainer}>
          <Package size={48} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.errorText}>Mission introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusInfo = () => {
    switch (mission.status) {
      case 'pending':
        return { icon: Clock, color: Colors.warning, label: 'En attente' };
      case 'accepted':
        return { icon: Navigation, color: Colors.info, label: 'Acceptée' };
      case 'in_progress':
        return { icon: Clock, color: Colors.secondary, label: 'En cours' };
      case 'completed':
        return { icon: CheckCircle, color: Colors.success, label: 'Terminée' };
      case 'cancelled':
        return { icon: XCircle, color: Colors.error, label: 'Annulée' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const canEdit = mission.status === 'pending';
  const canCancel = mission.status === 'pending' || mission.status === 'accepted';

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: 'Détails de la mission',
          headerBackTitle: 'Retour',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <StatusIcon size={20} color={statusInfo.color} strokeWidth={2} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <View 
            style={[
              styles.categoryDot,
              { backgroundColor: Colors.categories[mission.category] }
            ]}
          />
          <Text style={styles.categoryText}>{category?.label}</Text>
        </View>

        <Text style={styles.title}>{mission.title}</Text>
        <Text style={styles.description}>{mission.description}</Text>

        {mission.photos && mission.photos.length > 0 && (
          <View style={styles.photosSection}>
            <View style={styles.photosSectionHeader}>
              <ImageIcon size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.photosSectionTitle}>
                Photos ({mission.photos.length})
              </Text>
            </View>
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
          </View>
        )}

        <View style={styles.mapSection}>
          <RetractableMap
            latitude={mission.location.latitude}
            longitude={mission.location.longitude}
            address={mission.location.address}
            markers={mission.artisanLocation ? [{
              latitude: mission.artisanLocation.latitude,
              longitude: mission.artisanLocation.longitude,
              title: 'Artisan',
              description: 'Position de l\'artisan',
            }] : []}
            showUserLocation={true}
            testID="mission-details-map"
          />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MapPin size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>{mission.location.address || 'Non spécifiée'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Créée le</Text>
              <Text style={styles.infoValue}>
                {mission.createdAt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {mission.acceptedAt && (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <CheckCircle size={20} color={Colors.success} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Acceptée le</Text>
                <Text style={styles.infoValue}>
                  {mission.acceptedAt.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}

          {mission.completedAt && (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <CheckCircle size={20} color={Colors.success} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Terminée le</Text>
                <Text style={styles.infoValue}>
                  {mission.completedAt.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Euro size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {mission.finalPrice ? 'Prix final' : 'Prix estimé'}
              </Text>
              <Text style={styles.priceValue}>
                {mission.finalPrice || mission.estimatedPrice}€
              </Text>
            </View>
          </View>
        </View>

        {mission.status === 'completed' && !mission.artisanId && (
          <TouchableOpacity 
            style={styles.rateButton}
            onPress={() => router.push(`/rate?missionId=${mission.id}` as any)}
          >
            <Star size={20} color="#FFF" strokeWidth={2} />
            <Text style={styles.rateButtonText}>Noter l&apos;artisan</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {(canEdit || canCancel) && !isLoading && (
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + 16 }]}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEdit}
            >
              <Edit3 size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
          
          {canCancel && (
            <TouchableOpacity 
              style={[styles.cancelButton, !canEdit && styles.cancelButtonFull]}
              onPress={handleCancel}
            >
              <Trash2 size={20} color="#FFF" strokeWidth={2} />
              <Text style={styles.cancelButtonText}>Annuler la mission</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  mapSection: {
    marginBottom: 24,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  cancelButtonFull: {
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosSection: {
    marginBottom: 24,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  photosSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
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
