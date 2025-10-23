import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, MapPin, DollarSign, HelpCircle, LogOut, ChevronRight, Star, Briefcase } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions } from '@/contexts/MissionContext';
import { Artisan } from '@/types';
import { useState } from 'react';

export default function ArtisanProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuth();
  const { missions } = useMissions();
  const [isAvailable, setIsAvailable] = useState(true);
  
  const artisan = user?.type === 'artisan' ? (user as Artisan) : null;
  const artisanMissions = missions.filter(m => m.artisanId === user?.id);
  const completedCount = artisanMissions.filter(m => m.status === 'completed').length;

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnecter', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        },
      ]
    );
  };

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </View>
    );
  }

  if (!artisan) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Accès refusé</Text>
          <Text style={styles.errorSubtext}>Cette page est réservée aux artisans</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const menuSections = [
    {
      items: [
        { 
          icon: MapPin, 
          label: 'Rayon d\'intervention', 
          value: `${artisan.interventionRadius || 20} km`,
          onPress: () => console.log('Intervention radius') 
        },
        { 
          icon: DollarSign, 
          label: 'Tarifs', 
          value: `${artisan.hourlyRate || 50}€/h`,
          onPress: () => console.log('Rates') 
        },
        { 
          icon: Settings, 
          label: 'Paramètres', 
          onPress: () => console.log('Settings') 
        },
      ],
    },
    {
      items: [
        { icon: HelpCircle, label: 'Aide & Support', onPress: () => console.log('Help') },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'A'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Artisan'}</Text>
          <Text style={styles.email}>{user?.email || 'artisan@example.com'}</Text>

          {artisan?.specialties && artisan.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              {artisan.specialties.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.specialtyBadge}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Briefcase size={20} color={Colors.secondary} strokeWidth={2} />
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Missions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Star size={20} color={Colors.warning} strokeWidth={2} />
              <Text style={styles.statValue}>{user?.rating || '4.9'}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
          </View>
        </View>

        <View style={styles.availabilityCard}>
          <View style={styles.availabilityLeft}>
            <Text style={styles.availabilityLabel}>Disponibilité</Text>
            <Text style={styles.availabilityText}>
              {isAvailable ? 'Vous recevez des missions' : 'Vous ne recevez pas de missions'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: Colors.border, true: Colors.success }}
            thumbColor={Colors.surface}
          />
        </View>

        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Icon size={20} color={Colors.secondary} strokeWidth={2} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {'value' in item && item.value && (
                      <Text style={styles.menuValue}>{item.value}</Text>
                    )}
                    <ChevronRight size={20} color={Colors.textLight} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.error} strokeWidth={2} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  name: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  specialtyBadge: {
    backgroundColor: Colors.secondary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  availabilityLeft: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  version: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
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
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
