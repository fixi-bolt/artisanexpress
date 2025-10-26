import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, CheckCircle, XCircle, Navigation, Euro, Star, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMissions } from '@/contexts/MissionContext';
import { Mission } from '@/types';
import { categories } from '@/mocks/artisans';
import EmptyState from '@/components/EmptyState';
import { useEffect, useRef } from 'react';

export default function ClientMissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getUserMissions } = useMissions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const missions = getUserMissions();
  const activeMissions = missions.filter(m => m.status === 'pending' || m.status === 'accepted' || m.status === 'in_progress');
  const completedMissions = missions.filter(m => m.status === 'completed');
  const cancelledMissions = missions.filter(m => m.status === 'cancelled');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Mes Missions</Text>
        <Text style={styles.headerSubtitle}>
          {activeMissions.length} en cours
        </Text>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeMissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En cours</Text>
            {activeMissions.map((mission) => (
              <MissionCard 
                key={mission.id} 
                mission={mission}
                onPress={() => router.push(`/mission-details?missionId=${mission.id}` as any)}
              />
            ))}
          </View>
        )}

        {completedMissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terminées</Text>
            {completedMissions.map((mission) => (
              <MissionCard 
                key={mission.id} 
                mission={mission}
                onPress={() => router.push(`/mission-details?missionId=${mission.id}` as any)}
              />
            ))}
          </View>
        )}

        {cancelledMissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Annulées</Text>
            {cancelledMissions.map((mission) => (
              <MissionCard 
                key={mission.id} 
                mission={mission}
                onPress={() => router.push(`/mission-details?missionId=${mission.id}` as any)}
              />
            ))}
          </View>
        )}

        {missions.length === 0 && (
          <EmptyState
            icon={Package}
            title="Aucune mission"
            description="Vos demandes d'intervention apparaîtront ici"
            iconColor={Colors.primary}
          />
        )}
      </Animated.ScrollView>
    </View>
  );
}

function MissionCard({ mission, onPress }: { mission: Mission; onPress?: () => void }) {
  const category = categories.find(c => c.id === mission.category);
  
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

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardCategory}>
          <View 
            style={[
              styles.categoryDot,
              { backgroundColor: Colors.categories[mission.category] }
            ]}
          />
          <Text style={styles.categoryText}>{category?.label}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <StatusIcon size={14} color={statusInfo.color} strokeWidth={2} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{mission.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {mission.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Navigation size={14} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {mission.location.address?.split(',')[0]}
          </Text>
        </View>
        <View style={styles.cardPrice}>
          <Euro size={14} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.cardPriceText}>
            {mission.finalPrice || mission.estimatedPrice}€
          </Text>
        </View>
      </View>

      {mission.status === 'completed' && !mission.artisanId && (
        <TouchableOpacity style={styles.rateButton} activeOpacity={0.8}>
          <Star size={16} color={Colors.warning} strokeWidth={2} />
          <Text style={styles.rateButtonText}>Noter l&apos;artisan</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  cardMetaText: {
    fontSize: 13,
    color: Colors.textLight,
    flex: 1,
  },
  cardPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPriceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
  },

});
