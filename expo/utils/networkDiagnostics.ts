import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nkxucjhavjfsogzpitry.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVjamhhdmpmc29nenBpdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzMxMzAsImV4cCI6MjA3NjY0OTEzMH0.-JKjKW2_2ZQag1E7GzGEMvkuWxcWDzVSMB8mCoiNzig';

export const testBasicConnectivity = async (): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  console.log('🌐 Testing basic internet connectivity...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Basic connectivity: OK');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Basic connectivity: FAILED');
    return {
      success: false,
      error: 'Pas de connexion Internet',
      details: { message: error.message },
    };
  }
};

export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  console.log('🔍 Testing Supabase connection...');
  console.log('  URL:', SUPABASE_URL);
  console.log('  Platform:', Platform.OS);
  console.log('  Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const headers: Record<string, string> = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };
    
    console.log('  Attempting connection...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      signal: controller.signal,
      headers,
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Supabase connection successful!');
    console.log('  Status:', response.status);
    console.log('  StatusText:', response.statusText);
    
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return {
      success: true,
      details: {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      },
    };
  } catch (error: any) {
    console.error('❌ Supabase connection failed!');
    console.error('  Error name:', error.name);
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
    
    let errorMessage = 'Impossible de se connecter à Supabase';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Délai de connexion dépassé (15s). Vérifiez votre connexion.';
    } else if (error.message?.includes('Network request failed')) {
      errorMessage = 'Erreur réseau - La connexion à Supabase a échoué. Vérifiez que l\'URL est correcte et que les CORS sont configurés.';
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = 'Impossible d\'accéder à Supabase. Vérifiez l\'URL et la configuration CORS.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };
  }
};

export const getNetworkInfo = async () => {
  console.log('📡 Network Info:');
  console.log('  Platform:', Platform.OS);
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('  Supabase URL:', SUPABASE_URL);
  console.log('  Has Anon Key:', !!SUPABASE_ANON_KEY);
  
  return {
    platform: Platform.OS,
    environment: process.env.NODE_ENV,
    supabaseUrl: SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY,
  };
};

export const runFullDiagnostic = async () => {
  console.log('\n🚀 Running full network diagnostic...');
  console.log('========================================\n');
  
  const results = {
    info: await getNetworkInfo(),
    basicConnectivity: await testBasicConnectivity(),
    supabaseConnection: await testSupabaseConnection(),
  };
  
  console.log('\n========================================');
  console.log('📊 Diagnostic Results:');
  console.log('  Internet:', results.basicConnectivity.success ? '✅' : '❌');
  console.log('  Supabase:', results.supabaseConnection.success ? '✅' : '❌');
  
  if (!results.basicConnectivity.success) {
    console.log('\n⚠️  Pas de connexion Internet détectée');
  } else if (!results.supabaseConnection.success) {
    console.log('\n⚠️  Problème de connexion à Supabase:');
    console.log('    ', results.supabaseConnection.error);
    console.log('\n💡 Solutions possibles:');
    console.log('    1. Vérifier que l\'URL Supabase est correcte');
    console.log('    2. Vérifier que les CORS sont configurés dans Supabase');
    console.log('    3. Vérifier que la clé anon est valide');
    console.log('    4. Redémarrer l\'application');
  }
  
  console.log('========================================\n');
  
  return results;
};
