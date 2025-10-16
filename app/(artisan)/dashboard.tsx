import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, MapPin, Clock, Euro, Navigation, Image as ImageIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions } from '@/contexts/MissionContext';
import { Mission } from '@/types';

export default function ArtisanDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getPendingMissionsForArtisan, acceptMission, unreadNotificationsCount } = useMissions();
  
  const pendingMissions = getPendingMissionsForArtisan();

  const handleAcceptMission = (missionId: string) => {
    Alert.alert(
      'Accepter la mission',
      'Voulez-vous accepter cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => {
            acceptMission(missionId, user?.id || '');
            Alert.alert('Mission acceptée !', 'Le client a été notifié. Rendez-vous chez lui.');
            console.log('Mission accepted:', missionId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.userName}>{user?.name || 'Artisan'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
          <Bell size={24} color={Colors.text} strokeWidth={2} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Statut</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Disponible</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
            <Text style={styles.settingsButtonText}>Gérer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Nouvelles demandes
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pendingMissions.length}</Text>
            </View>
          </View>

          {pendingMissions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
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

function MissionRequestCard({ mission, onAccept }: { mission: Mission; onAccept: () => void }) {
  const timeAgo = Math.floor((Date.now() - mission.createdAt.getTime()) / 60000);

  return (
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
    </View>
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
  settingsButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
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
});
