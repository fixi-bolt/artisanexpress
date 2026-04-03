import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Briefcase, Search, Trash2, MapPin } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import colors from '@/constants/colors';
import { MissionStatus } from '@/types';
import MissionStatusBadge from '@/components/MissionStatusBadge';

type FilterType = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export default function AdminMissionsScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState<string>('');

  const missionsQuery = trpc.admin.getMissions.useQuery({ status: filter });
  const deleteMissionMutation = trpc.admin.deleteMission.useMutation({
    onSuccess: () => {
      Alert.alert('Succès', 'Mission supprimée');
      missionsQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Erreur', error.message);
    },
  });

  const handleDeleteMission = (missionId: string, missionTitle: string) => {
    Alert.alert(
      'Confirmer',
      `Voulez-vous supprimer "${missionTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteMissionMutation.mutate({ missionId });
          },
        },
      ]
    );
  };

  const filteredMissions = missionsQuery.data?.filter((mission) =>
    mission.title.toLowerCase().includes(search.toLowerCase()) ||
    mission.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestion Missions',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une mission..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {(['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                filter === f && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {missionsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {filteredMissions.map((mission) => (
              <View key={mission.id} style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <View style={styles.missionTitleContainer}>
                    <Text style={styles.missionTitle}>{mission.title}</Text>
                    <MissionStatusBadge status={mission.status as MissionStatus} />
                  </View>
                  <Text style={styles.missionPrice}>{mission.estimatedPrice}€</Text>
                </View>

                <Text style={styles.missionDescription} numberOfLines={2}>
                  {mission.description}
                </Text>

                {mission.location.address && (
                  <View style={styles.locationContainer}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {mission.location.address}
                    </Text>
                  </View>
                )}

                <View style={styles.missionMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Client:</Text>
                    <Text style={styles.metaValue}>{mission.clientId}</Text>
                  </View>
                  {mission.artisanId && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Artisan:</Text>
                      <Text style={styles.metaValue}>{mission.artisanId}</Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Commission:</Text>
                    <Text style={styles.metaValue}>{mission.commission}%</Text>
                  </View>
                </View>

                <View style={styles.missionFooter}>
                  <Text style={styles.missionDate}>
                    {new Date(mission.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMission(mission.id, mission.title)}
                    disabled={deleteMissionMutation.isPending}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={styles.deleteText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>

                {mission.photos && mission.photos.length > 0 && (
                  <View style={styles.photosIndicator}>
                    <Text style={styles.photosText}>
                      {mission.photos.length} photo{mission.photos.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {filteredMissions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Briefcase size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucune mission trouvée</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

function getFilterLabel(filter: FilterType): string {
  const labels: Record<FilterType, string> = {
    all: 'Toutes',
    pending: 'En attente',
    accepted: 'Acceptées',
    in_progress: 'En cours',
    completed: 'Terminées',
    cancelled: 'Annulées',
  };
  return labels[filter];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterScrollView: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  missionTitleContainer: {
    flex: 1,
    gap: 8,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  missionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 12,
  },
  missionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  missionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  photosIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  photosText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
