import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';

import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp,
  Activity,
  Star,
  ChevronRight,
  BarChart3,
  Mail,
  UserCog,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import colors from '@/constants/colors';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const statsQuery = trpc.admin.getStats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await statsQuery.refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log('Admin Dashboard - Stats loaded:', statsQuery.data);
  }, [statsQuery.data]);

  if (statsQuery.isLoading && !statsQuery.data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = statsQuery.data;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vue d&apos;ensemble</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
            <Text style={styles.statDetail}>
              {stats?.totalClients || 0} clients • {stats?.totalArtisans || 0} artisans
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
              <Briefcase size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats?.totalMissions || 0}</Text>
            <Text style={styles.statLabel}>Missions</Text>
            <Text style={styles.statDetail}>
              {stats?.activeMissions || 0} actives • {stats?.completedMissions || 0} terminées
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' + '20' }]}>
              <DollarSign size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats?.totalRevenue.toFixed(0) || 0}€</Text>
            <Text style={styles.statLabel}>Revenus</Text>
            <Text style={styles.statDetail}>
              {stats?.totalCommissions.toFixed(2) || 0}€ commissions
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' + '20' }]}>
              <Star size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.averageRating.toFixed(1) || 0}</Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
            <Text style={styles.statDetail}>Tous les artisans</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin-users' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Users size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Gérer les utilisateurs</Text>
                <Text style={styles.actionSubtitle}>Clients et artisans</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin-missions' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                <Activity size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Gérer les missions</Text>
                <Text style={styles.actionSubtitle}>Suivi et modération</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin-transactions' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' + '20' }]}>
                <TrendingUp size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Voir les transactions</Text>
                <Text style={styles.actionSubtitle}>Paiements et commissions</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin-analytics' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                <BarChart3 size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Analyses Business</Text>
                <Text style={styles.actionSubtitle}>Revenus, utilisateurs, conversion</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin-marketing' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#EC4899' + '20' }]}>
                <Mail size={20} color="#EC4899" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Campagnes Marketing</Text>
                <Text style={styles.actionSubtitle}>Email, push, SMS, parrainage</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin-crm' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#06B6D4' + '20' }]}>
                <UserCog size={20} color="#06B6D4" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Gestion CRM</Text>
                <Text style={styles.actionSubtitle}>Relations clients et artisans</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {stats?.recentMissions && stats.recentMissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dernières missions</Text>
            {stats.recentMissions.slice(0, 3).map((mission) => (
              <View key={mission.id} style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionPrice}>{mission.estimatedPrice}€</Text>
                </View>
                <Text style={styles.missionDescription} numberOfLines={2}>
                  {mission.description}
                </Text>
                <View style={styles.missionFooter}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(mission.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(mission.status) }
                    ]}>
                      {getStatusLabel(mission.status)}
                    </Text>
                  </View>
                  <Text style={styles.missionDate}>
                    {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    accepted: '#3B82F6',
    in_progress: '#8B5CF6',
    completed: '#10B981',
    cancelled: '#EF4444',
  };
  return colors[status] || '#6B7280';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  missionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  missionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
