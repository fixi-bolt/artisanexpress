import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Nettoie les sessions expirées et le localStorage corrompu
 * À appeler si l'utilisateur rencontre des erreurs de session
 */
export async function clearSessionErrors(): Promise<void> {
  console.log('🧹 Nettoyage des sessions et du localStorage...');

  try {
    // 1. Déconnexion de Supabase (ignore les erreurs)
    await supabase.auth.signOut().catch(() => {});

    // 2. Nettoyer le localStorage/AsyncStorage
    if (Platform.OS === 'web') {
      // Web: nettoyer localStorage
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('sb-') ||
          key.includes('automation:settings')
        )) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
          console.log('✅ Supprimé:', key);
        } catch {
          console.warn('⚠️ Impossible de supprimer:', key);
        }
      });

      // Réinitialiser les settings par défaut
      window.localStorage.setItem('automation:settings', JSON.stringify({
        autoInvoice: true,
        autoReminderDays: 3,
        accountingExport: 'monthly',
      }));

    } else {
      // Mobile: nettoyer AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => 
        key.includes('supabase') ||
        key.includes('sb-') ||
        key.includes('automation:settings')
      );

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log('✅ Supprimé', keysToRemove.length, 'clés');
      }

      // Réinitialiser les settings par défaut
      await AsyncStorage.setItem('automation:settings', JSON.stringify({
        autoInvoice: true,
        autoReminderDays: 3,
        accountingExport: 'monthly',
      }));
    }

    console.log('✅ Nettoyage terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Nettoie uniquement les données d'automation corrompues
 */
export async function clearAutomationSettings(): Promise<void> {
  console.log('🧹 Nettoyage des paramètres d\'automation...');

  const defaultSettings = {
    autoInvoice: true,
    autoReminderDays: 3,
    accountingExport: 'monthly',
  };

  try {
    const key = 'automation:settings';
    
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
      window.localStorage.setItem(key, JSON.stringify(defaultSettings));
    } else {
      await AsyncStorage.removeItem(key);
      await AsyncStorage.setItem(key, JSON.stringify(defaultSettings));
    }

    console.log('✅ Paramètres d\'automation réinitialisés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des paramètres:', error);
    throw error;
  }
}

/**
 * Vérifie si une session est valide
 */
export async function checkSessionValidity(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Session invalide:', error.message);
      return false;
    }

    if (!session) {
      console.log('ℹ️ Aucune session active');
      return false;
    }

    // Vérifier si le token est expiré
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      console.log('❌ Session expirée');
      return false;
    }

    console.log('✅ Session valide');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de session:', error);
    return false;
  }
}
