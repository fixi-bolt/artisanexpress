/**
 * 🎯 EXEMPLE D'INTÉGRATION DES HOOKS SUPABASE
 * 
 * Ce fichier montre comment utiliser les nouveaux hooks Supabase
 * dans votre application ArtisanNow.
 */

import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseMissions } from '@/hooks/useSupabaseMissions';
import { useSupabaseArtisans } from '@/hooks/useSupabaseArtisans';
import type { ArtisanCategory } from '@/types';

/**
 * ========================================
 * EXEMPLE 1: Écran d'Authentification
 * ========================================
 */
export const AuthExample = () => {
  const { user, isLoading, isAuthenticated, signIn, signUp, signOut } = useSupabaseAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');

  const handleSignUp = async () => {
    try {
      await signUp(email, password, name, 'client', {
        phone: '+33612345678',
      });
      Alert.alert('Succès', 'Compte créé avec succès !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      Alert.alert('Succès', 'Connexion réussie !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (isAuthenticated && user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bienvenue {user.name}</Text>
        <Text>Email: {user.email}</Text>
        <Text>Type: {user.type}</Text>
        <Button title="Se déconnecter" onPress={signOut} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion / Inscription</Text>
      <Button title="Se connecter" onPress={handleSignIn} />
      <Button title="S'inscrire" onPress={handleSignUp} />
    </View>
  );
};

/**
 * ========================================
 * EXEMPLE 2: Liste des Missions (Client)
 * ========================================
 */
export const ClientMissionsExample = () => {
  const { user } = useSupabaseAuth();
  const {
    missions,
    isLoading,
    createMission,
    updateMissionStatus,
  } = useSupabaseMissions(user?.id, user?.type);

  const handleCreateMission = async () => {
    if (!user) return;

    try {
      await createMission({
        category: 'plumber' as ArtisanCategory,
        title: 'Fuite d&apos;eau urgente',
        description: 'Fuite sous l&apos;évier de la cuisine',
        location: {
          latitude: 48.8566,
          longitude: 2.3522,
          address: '123 Rue de Paris, 75001 Paris',
        },
        estimatedPrice: 120,
        photos: ['https://example.com/photo1.jpg'],
      });
      Alert.alert('Succès', 'Mission créée !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleCancelMission = async (missionId: string) => {
    try {
      await updateMissionStatus(missionId, 'cancelled');
      Alert.alert('Succès', 'Mission annulée');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des missions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Missions</Text>
      <Button title="Créer une mission" onPress={handleCreateMission} />
      
      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{item.title}</Text>
            <Text>Catégorie: {item.category}</Text>
            <Text>Statut: {item.status}</Text>
            <Text>Prix estimé: {item.estimatedPrice}€</Text>
            
            {item.status === 'pending' && (
              <Button
                title="Annuler"
                onPress={() => handleCancelMission(item.id)}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune mission</Text>
        }
      />
    </View>
  );
};

/**
 * ========================================
 * EXEMPLE 3: Missions Disponibles (Artisan)
 * ========================================
 */
export const ArtisanMissionsExample = () => {
  const { user } = useSupabaseAuth();
  const {
    missions,
    isLoading,
    acceptMission,
    updateMissionStatus,
  } = useSupabaseMissions(user?.id, user?.type);

  const availableMissions = missions.filter(m => m.status === 'pending');
  const myMissions = missions.filter(m => m.artisanId === user?.id);

  const handleAcceptMission = async (missionId: string) => {
    try {
      await acceptMission(missionId);
      Alert.alert('Succès', 'Mission acceptée !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleStartMission = async (missionId: string) => {
    try {
      await updateMissionStatus(missionId, 'in_progress');
      Alert.alert('Succès', 'Mission démarrée !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      await updateMissionStatus(missionId, 'completed', {
        finalPrice: 150,
      });
      Alert.alert('Succès', 'Mission terminée !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Missions Disponibles</Text>
      
      <Text style={styles.subtitle}>Nouvelles missions</Text>
      <FlatList
        data={availableMissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>Prix estimé: {item.estimatedPrice}€</Text>
            <Button
              title="Accepter"
              onPress={() => handleAcceptMission(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune mission disponible</Text>
        }
      />

      <Text style={styles.subtitle}>Mes missions en cours</Text>
      <FlatList
        data={myMissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{item.title}</Text>
            <Text>Statut: {item.status}</Text>
            
            {item.status === 'accepted' && (
              <Button
                title="Démarrer"
                onPress={() => handleStartMission(item.id)}
              />
            )}
            
            {item.status === 'in_progress' && (
              <Button
                title="Terminer"
                onPress={() => handleCompleteMission(item.id)}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune mission en cours</Text>
        }
      />
    </View>
  );
};

/**
 * ========================================
 * EXEMPLE 4: Recherche d'Artisans
 * ========================================
 */
export const ArtisansSearchExample = () => {
  const [selectedCategory, setSelectedCategory] = useState<ArtisanCategory>('plumber');
  
  const {
    artisans,
    isLoading,
    getArtisanById,
  } = useSupabaseArtisans({
    category: selectedCategory,
    isAvailable: true,
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      radius: 20,
    },
  });

  const handleViewArtisan = async (artisanId: string) => {
    try {
      const artisan = await getArtisanById(artisanId);
      Alert.alert(
        artisan.name,
        `Catégorie: ${artisan.category}\nTarif: ${artisan.hourlyRate}€/h\nRayon: ${artisan.interventionRadius}km`
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Recherche d'artisans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Artisans Disponibles</Text>
      <Text>Catégorie: {selectedCategory}</Text>
      
      <FlatList
        data={artisans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.artisanCard}>
            <Text style={styles.artisanName}>{item.name}</Text>
            <Text>⭐ {item.rating?.toFixed(1) || '0.0'} ({item.reviewCount} avis)</Text>
            <Text>💰 {item.hourlyRate}€/h</Text>
            <Text>🚗 Frais de déplacement: {item.travelFee}€</Text>
            <Text>📍 Rayon: {item.interventionRadius}km</Text>
            <Text>✅ {item.completedMissions} missions terminées</Text>
            
            {item.specialties.length > 0 && (
              <Text>Spécialités: {item.specialties.join(', ')}</Text>
            )}
            
            <Button
              title="Voir le profil"
              onPress={() => handleViewArtisan(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun artisan disponible</Text>
        }
      />
    </View>
  );
};

/**
 * ========================================
 * EXEMPLE 5: Écran Complet avec Navigation
 * ========================================
 */
export const CompleteExample = () => {
  const { user, isAuthenticated } = useSupabaseAuth();

  if (!isAuthenticated || !user) {
    return <AuthExample />;
  }

  if (user.type === 'client') {
    return <ClientMissionsExample />;
  }

  if (user.type === 'artisan') {
    return <ArtisanMissionsExample />;
  }

  return (
    <View style={styles.container}>
      <Text>Type d&apos;utilisateur non supporté</Text>
    </View>
  );
};

/**
 * ========================================
 * Styles
 * ========================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  missionCard: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  artisanCard: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 12,
  },
  artisanName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 16,
  },
});

/**
 * ========================================
 * 📝 NOTES D'UTILISATION
 * ========================================
 * 
 * 1. Remplacez @nkzw/create-context-hook par ces hooks dans vos contextes
 * 2. Les hooks gèrent automatiquement le temps réel avec Supabase
 * 3. Toutes les erreurs sont propagées pour un meilleur contrôle
 * 4. Les données sont typées avec TypeScript pour la sécurité
 * 
 * AVANTAGES:
 * - ✅ Temps réel automatique
 * - ✅ TypeScript complet
 * - ✅ Gestion d'erreurs
 * - ✅ Chargement optimisé
 * - ✅ RLS respecté
 * 
 * ========================================
 */
