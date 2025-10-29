import { Platform } from 'react-native';

export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mxlxwqhkodgixztnydzd.supabase.co';
  
  console.log('🔍 Testing Supabase connection...');
  console.log('  URL:', supabaseUrl);
  console.log('  Platform:', Platform.OS);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Supabase connection test successful');
    console.log('  Status:', response.status);
    console.log('  Headers:', Object.fromEntries(response.headers.entries()));
    
    return {
      success: true,
      details: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      },
    };
  } catch (error: any) {
    console.error('❌ Supabase connection test failed');
    console.error('  Error:', error.message);
    console.error('  Type:', error.name);
    
    let errorMessage = 'Impossible de se connecter à Supabase';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Délai de connexion dépassé (timeout)';
    } else if (error.message?.includes('Network')) {
      errorMessage = 'Erreur réseau - Vérifiez votre connexion Internet';
    } else if (error.message?.includes('fetch')) {
      errorMessage = 'Erreur de connexion - Le serveur est peut-être inaccessible';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: {
        name: error.name,
        message: error.message,
      },
    };
  }
};

export const getNetworkInfo = async () => {
  console.log('📡 Network Info:');
  console.log('  Platform:', Platform.OS);
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('  Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('  Has Anon Key:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  
  return {
    platform: Platform.OS,
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
};
