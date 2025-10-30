import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mxlxwqhkodgixztnydzd.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bHh3cWhrb2RnaXh6dG55ZHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDQyNDEsImV4cCI6MjA1MzgyMDI0MX0.IKvmfNLVXR5BtoCPkWNOyZXFczuUTPqLbNKiKQU4KPc';

export async function testSupabaseConnection() {
  console.log('==============================================');
  console.log('🧪 Testing Supabase Connection');
  console.log('==============================================');
  console.log('Platform:', Platform.OS);
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Has API Key:', !!SUPABASE_ANON_KEY);
  console.log('----------------------------------------------');

  try {
    console.log('🌐 Test 1: Basic fetch to Supabase /rest/v1/');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    console.log('✅ Response received!');
    console.log('Status:', response.status);
    console.log('StatusText:', response.statusText);
    console.log('Headers:', JSON.stringify(Array.from(response.headers.entries())));
    
    const text = await response.text();
    console.log('Body:', text.substring(0, 200));
    
    return { success: true, status: response.status };
  } catch (error: any) {
    console.error('❌ Test failed!');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error type:', typeof error);
    console.error('Error toString:', error?.toString());
    
    if (error?.stack) {
      console.error('Stack:', error.stack);
    }
    
    return { 
      success: false, 
      error: error?.message || 'Unknown error',
      type: error?.name || typeof error,
    };
  } finally {
    console.log('==============================================');
  }
}
