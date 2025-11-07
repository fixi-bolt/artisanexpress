import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanStorage, clearAllStorage } from '@/utils/cleanStorage';

export default function StorageDebug() {
  const [keys, setKeys] = useState<string[]>([]);
  const [corruptedKeys, setCorruptedKeys] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanStorage = async () => {
    setIsScanning(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      setKeys([...allKeys]);

      const corrupted: string[] = [];
      
      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value && (value.startsWith('{') || value.startsWith('['))) {
            try {
              JSON.parse(value);
            } catch {
              corrupted.push(key);
            }
          }
        } catch {
          corrupted.push(key);
        }
      }

      setCorruptedKeys(corrupted);
      
      if (corrupted.length > 0) {
        Alert.alert(
          '⚠️ Données corrompues détectées',
          `${corrupted.length} clé(s) corrompue(s) trouvée(s):\n${corrupted.join('\n')}`,
          [
            { text: 'Ignorer', style: 'cancel' },
            { 
              text: 'Nettoyer', 
              style: 'destructive',
              onPress: handleCleanCorrupted
            }
          ]
        );
      } else {
        Alert.alert('✅ Tout est OK', 'Aucune donnée corrompue détectée');
      }
    } catch {
      Alert.alert('❌ Erreur', 'Impossible de scanner le storage');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCleanCorrupted = async () => {
    try {
      await cleanStorage();
      Alert.alert('✅ Nettoyage réussi', 'Les données corrompues ont été supprimées');
      await scanStorage();
    } catch {
      Alert.alert('❌ Erreur', 'Échec du nettoyage');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      '⚠️ Attention',
      'Voulez-vous vraiment supprimer TOUTES les données ? Vous serez déconnecté.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Tout supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllStorage();
              Alert.alert('✅ Storage vidé', 'Toutes les données ont été supprimées. Redémarrez l\'app.');
            } catch {
              Alert.alert('❌ Erreur', 'Échec de la suppression');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Storage Debug</Text>
      
      <View style={styles.stats}>
        <Text style={styles.statText}>Total clés: {keys.length}</Text>
        <Text style={[styles.statText, corruptedKeys.length > 0 && styles.error]}>
          Corrompues: {corruptedKeys.length}
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={scanStorage}
          disabled={isScanning}
        >
          <Text style={styles.buttonText}>
            {isScanning ? '⏳ Scan en cours...' : '🔍 Scanner Storage'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={handleCleanCorrupted}
          disabled={corruptedKeys.length === 0}
        >
          <Text style={styles.buttonText}>
            🧹 Nettoyer Corrompues ({corruptedKeys.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={handleClearAll}
        >
          <Text style={styles.buttonText}>
            🗑️ Tout Supprimer
          </Text>
        </TouchableOpacity>
      </View>

      {corruptedKeys.length > 0 && (
        <ScrollView style={styles.list}>
          <Text style={styles.listTitle}>⚠️ Clés corrompues:</Text>
          {corruptedKeys.map((key, index) => (
            <Text key={index} style={styles.listItem}>• {key}</Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
  },
  buttons: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    maxHeight: 300,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    paddingVertical: 5,
    color: '#ef4444',
  },
});
