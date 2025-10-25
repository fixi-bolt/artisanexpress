import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const AUTH_STORAGE_KEYS = [
  '@supabase.auth.token',
  'supabase.auth.token',
  '@supabase/auth/session',
  'sb-nkxucjhavjfsogzpitry-auth-token',
];

export async function clearAuthState() {
  console.log('🧹 Clearing auth state...');
  
  try {
    await supabase.auth.signOut({ scope: 'local' });
    
    for (const key of AUTH_STORAGE_KEYS) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        console.warn(`Could not remove ${key}:`, e);
      }
    }
    
    const allKeys = await AsyncStorage.getAllKeys();
    const authKeys = allKeys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') ||
      key.includes('sb-')
    );
    
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log('✅ Cleared additional auth keys:', authKeys);
    }
    
    console.log('✅ Auth state cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
  }
}
