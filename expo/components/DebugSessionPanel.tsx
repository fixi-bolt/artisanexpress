import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { clearSessionErrors, checkSessionValidity, clearAutomationSettings } from '@/utils/clearSessionErrors';
import { AlertCircle, Trash2, CheckCircle } from 'lucide-react-native';

/**
 * Panneau de debug pour gérer les erreurs de session
 * À afficher uniquement en développement ou dans les paramètres
 */
export function DebugSessionPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');

  const handleCheckSession = async () => {
    setIsChecking(true);
    try {
      const isValid = await checkSessionValidity();
      setSessionStatus(isValid ? 'valid' : 'invalid');
      
      Alert.alert(
        isValid ? '✅ Session Valide' : '⚠️ Session Invalide',
        isValid 
          ? 'Votre session est active et valide'
          : 'Votre session a expiré ou est invalide. Veuillez vous reconnecter.',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('❌ Erreur', 'Impossible de vérifier la session');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      '⚠️ Confirmation',
      'Cela va supprimer toutes les sessions et réinitialiser les paramètres. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, nettoyer',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearSessionErrors();
              Alert.alert(
                '✅ Nettoyage Terminé',
                'Les sessions et paramètres ont été réinitialisés. Veuillez vous reconnecter.',
                [{ text: 'OK' }]
              );
              setSessionStatus('unknown');
            } catch {
              Alert.alert('❌ Erreur', 'Impossible de nettoyer les données');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAutomation = async () => {
    setIsClearing(true);
    try {
      await clearAutomationSettings();
      Alert.alert(
        '✅ Réinitialisé',
        'Les paramètres d\'automation ont été réinitialisés',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('❌ Erreur', 'Impossible de réinitialiser les paramètres');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertCircle size={24} color="#FF6B6B" />
        <Text style={styles.title}>Debug Session</Text>
      </View>

      <Text style={styles.description}>
        Outils de débogage pour résoudre les problèmes de session et de stockage
      </Text>

      {/* Status */}
      {sessionStatus !== 'unknown' && (
        <View style={[
          styles.statusBadge,
          sessionStatus === 'valid' ? styles.statusValid : styles.statusInvalid
        ]}>
          <Text style={styles.statusText}>
            {sessionStatus === 'valid' ? '✅ Session Valide' : '⚠️ Session Invalide'}
          </Text>
        </View>
      )}

      {/* Boutons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonCheck]}
          onPress={handleCheckSession}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.buttonText}>Vérifier Session</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonClear]}
          onPress={handleClearAutomation}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Trash2 size={20} color="#fff" />
              <Text style={styles.buttonText}>Réinitialiser Automation</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleClearAll}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Trash2 size={20} color="#fff" />
              <Text style={styles.buttonText}>Nettoyer Tout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.warning}>
        ⚠️ Ces outils sont destinés au débogage uniquement. Utilisez-les si vous rencontrez des erreurs de session.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FF6B6B',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusValid: {
    backgroundColor: '#D4EDDA',
  },
  statusInvalid: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonCheck: {
    backgroundColor: '#4A90E2',
  },
  buttonClear: {
    backgroundColor: '#FF9500',
  },
  buttonDanger: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  warning: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    fontStyle: 'italic' as const,
    textAlign: 'center',
  },
});
