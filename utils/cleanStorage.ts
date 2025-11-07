import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Safely gets a JSON value from AsyncStorage
 * Returns null if parsing fails
 */
export async function safeGetItem<T = any>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      console.warn(`⚠️ Failed to parse value for key "${key}", removing corrupted data`);
      await AsyncStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error reading key "${key}":`, error);
    return null;
  }
}

/**
 * Safely sets a JSON value to AsyncStorage
 */
export async function safeSetItem<T = any>(key: string, value: T): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`❌ Error setting key "${key}":`, error);
    return false;
  }
}

/**
 * Nettoie le storage en retirant toutes les valeurs corrompues
 * qui causent des erreurs JSON Parse
 */
export async function cleanStorage() {
  console.log('🧹 Starting storage cleanup...');

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`Found ${allKeys.length} keys in storage`);

    let cleanedCount = 0;
    let errorCount = 0;

    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        
        if (value === null || value === undefined) {
          continue;
        }

        // Test si la valeur peut être parsée
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            JSON.parse(value);
          } catch {
            // Valeur corrompue - on la supprime
            console.warn(`❌ Corrupted value found for key "${key}": ${value.substring(0, 50)}...`);
            await AsyncStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (err) {
        console.error(`Error processing key "${key}":`, err);
        errorCount++;
      }
    }

    console.log(`✅ Storage cleanup complete: ${cleanedCount} corrupted values removed, ${errorCount} errors`);
    return { cleanedCount, errorCount };
  } catch (error) {
    console.error('❌ Failed to clean storage:', error);
    throw error;
  }
}

/**
 * Nettoie complètement le storage (utiliser avec précaution)
 */
export async function clearAllStorage() {
  console.log('🗑️ Clearing all storage...');
  
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } else {
      await AsyncStorage.clear();
    }
    
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('❌ Failed to clear storage:', error);
    throw error;
  }
}
