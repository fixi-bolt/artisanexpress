import { Platform } from 'react-native';

export async function clearAutomationStorage() {
  const key = 'automation:settings';
  
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        console.log('Clearing web localStorage for automation');
        window.localStorage.removeItem(key);
        console.log('✓ Automation storage cleared (web)');
      }
    } else {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      console.log('Clearing AsyncStorage for automation');
      await AsyncStorage.removeItem(key);
      console.log('✓ Automation storage cleared (native)');
    }
    return true;
  } catch (error) {
    console.error('Failed to clear automation storage:', error);
    return false;
  }
}

export function clearAutomationStorageSync() {
  const key = 'automation:settings';
  
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      console.log('Clearing web localStorage for automation (sync)');
      window.localStorage.removeItem(key);
      console.log('✓ Automation storage cleared (web, sync)');
      return true;
    } catch (error) {
      console.error('Failed to clear automation storage (sync):', error);
      return false;
    }
  }
  
  return false;
}
