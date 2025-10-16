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
import { Users, Search, AlertCircle, Ban } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import colors from '@/constants/colors';
import { Artisan, Client } from '@/types';

type FilterType = 'all' | 'client' | 'artisan';

export default function AdminUsersScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState<string>('');

  const usersQuery = trpc.admin.getUsers.useQuery({ type: filter });
  const suspendUserMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => {
      Alert.alert('Succès', 'Utilisateur suspendu');
      usersQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Erreur', error.message);
    },
  });

  const handleSuspendUser = (userId: string, userName: string) => {
    Alert.alert(
      'Confirmer',
      `Voulez-vous suspendre ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Suspendre',
          style: 'destructive',
          onPress: () => {
            suspendUserMutation.mutate({
              userId,
              reason: 'Suspended by admin',
            });
          },
        },
      ]
    );
  };

  const filteredUsers = usersQuery.data?.users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestion Utilisateurs',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              Tous ({usersQuery.data?.totalCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'client' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('client')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'client' && styles.filterTextActive,
              ]}
            >
              Clients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'artisan' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('artisan')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'artisan' && styles.filterTextActive,
              ]}
            >
              Artisans
            </Text>
          </TouchableOpacity>
        </View>

        {usersQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    {user.photo ? (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.avatar}>
                        <Users size={24} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userPhone}>{user.phone}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: user.type === 'client' ? '#3B82F6' : '#10B981' }
                  ]}>
                    <Text style={styles.typeText}>
                      {user.type === 'client' ? 'Client' : 'Artisan'}
                    </Text>
                  </View>
                </View>

                {user.type === 'artisan' && (
                  <View style={styles.artisanInfo}>
                    <Text style={styles.artisanCategory}>
                      {getCategoryLabel((user as Artisan).category)}
                    </Text>
                    <Text style={styles.artisanRate}>
                      {(user as Artisan).hourlyRate}€/h • {(user as Artisan).completedMissions} missions
                    </Text>
                  </View>
                )}

                <View style={styles.userStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user.rating?.toFixed(1) || 'N/A'}</Text>
                    <Text style={styles.statLabel}>Note</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user.reviewCount || 0}</Text>
                    <Text style={styles.statLabel}>Avis</Text>
                  </View>
                  {user.type === 'client' && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {(user as Client).paymentMethods.length}
                      </Text>
                      <Text style={styles.statLabel}>Paiements</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert('Info', `Détails de ${user.name}`);
                    }}
                  >
                    <AlertCircle size={18} color={colors.primary} />
                    <Text style={styles.actionText}>Détails</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={() => handleSuspendUser(user.id, user.name)}
                    disabled={suspendUserMutation.isPending}
                  >
                    <Ban size={18} color={colors.error} />
                    <Text style={[styles.actionText, styles.dangerText]}>Suspendre</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {filteredUsers.length === 0 && (
              <View style={styles.emptyContainer}>
                <Users size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    plumber: 'Plombier',
    electrician: 'Électricien',
    carpenter: 'Menuisier',
    locksmith: 'Serrurier',
    painter: 'Peintre',
    mechanic: 'Mécanicien',
    hvac: 'Chauffagiste',
    gardener: 'Jardinier',
  };
  return labels[category] || category;
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  artisanInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  artisanCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  artisanRate: {
    fontSize: 13,
    color: '#6B7280',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dangerText: {
    color: colors.error,
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
