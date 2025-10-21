import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveEnv(): { url: string; key: string; source: string } {
  const rorkEnv = (globalThis as unknown as { __RORK__?: { env?: Record<string, string> }; RORK_ENV?: Record<string, string> }).__RORK__?.env
    ?? (globalThis as unknown as { RORK_ENV?: Record<string, string> }).RORK_ENV
    ?? {};

  const candidates: Array<{ url?: string; key?: string; source: string }> = [
    { url: process.env.EXPO_PUBLIC_SUPABASE_URL, key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, source: 'process.env (EXPO_PUBLIC_*)' },
    { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY, source: 'process.env' },
    { url: (Constants?.expoConfig as any)?.extra?.supabaseUrl, key: (Constants?.expoConfig as any)?.extra?.supabaseAnonKey, source: 'app.json extra' },
    { url: rorkEnv.EXPO_PUBLIC_SUPABASE_URL ?? rorkEnv.SUPABASE_URL, key: rorkEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? rorkEnv.SUPABASE_ANON_KEY, source: 'RORK_ENV' },
  ];

  for (const c of candidates) {
    const url = (c.url ?? '').trim();
    const key = (c.key ?? '').trim();
    if (url && key) return { url, key, source: c.source };
  }
  return { url: (candidates[0].url ?? '').trim(), key: (candidates[0].key ?? '').trim(), source: 'fallback-empty' };
}

const { url: supabaseUrl, key: supabaseAnonKey, source } = resolveEnv();

console.log('🔧 Supabase Config Check:');
console.log('  Source:', source);
console.log('  URL:', supabaseUrl || '❌ MISSING');
console.log('  Key:', supabaseAnonKey ? `✅ ${supabaseAnonKey.substring(0, 4)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 4)}` : '❌ MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ SUPABASE NOT CONFIGURED!');
  console.error('❌ Variables attendues: EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('❌ Aucune coupure de l\'app. On continue pour éviter un crash sur votre environnement.');
}

if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.warn('\n⚠️ Format URL Supabase inattendu');
  console.warn('   Attendu: https://xxx.supabase.co');
  console.warn('   Actuel :', supabaseUrl);
}

if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('\n⚠️ Clé Supabase semble invalide (ne commence pas par eyJ). Vérifiez vos variables.');
}

export const supabase = createClient(supabaseUrl || 'https://invalid.supabase.co', supabaseAnonKey || 'invalid', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' ? true : false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          photo: string | null;
          user_type: 'client' | 'artisan' | 'admin';
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          photo?: string | null;
          user_type: 'client' | 'artisan' | 'admin';
          rating?: number;
          review_count?: number;
        };
        Update: {
          email?: string;
          name?: string;
          phone?: string | null;
          photo?: string | null;
          rating?: number;
          review_count?: number;
        };
      };
      artisans: {
        Row: {
          id: string;
          category: string;
          hourly_rate: number;
          travel_fee: number;
          intervention_radius: number;
          is_available: boolean;
          latitude: number | null;
          longitude: number | null;
          completed_missions: number;
          specialties: string[];
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category: string;
          hourly_rate: number;
          travel_fee: number;
          intervention_radius: number;
          is_available?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          completed_missions?: number;
          specialties?: string[];
          is_suspended?: boolean;
        };
        Update: {
          category?: string;
          hourly_rate?: number;
          travel_fee?: number;
          intervention_radius?: number;
          is_available?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          completed_missions?: number;
          specialties?: string[];
          is_suspended?: boolean;
        };
      };
      clients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
        };
        Update: {};
      };
      admins: {
        Row: {
          id: string;
          role: 'super_admin' | 'moderator';
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: 'super_admin' | 'moderator';
          permissions?: string[];
        };
        Update: {
          role?: 'super_admin' | 'moderator';
          permissions?: string[];
        };
      };
      missions: {
        Row: {
          id: string;
          client_id: string;
          artisan_id: string | null;
          category: string;
          title: string;
          description: string;
          photos: string[];
          latitude: number;
          longitude: number;
          address: string | null;
          status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          estimated_price: number;
          final_price: number | null;
          commission: number;
          eta: number | null;
          artisan_latitude: number | null;
          artisan_longitude: number | null;
          created_at: string;
          accepted_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          artisan_id?: string | null;
          category: string;
          title: string;
          description: string;
          photos?: string[];
          latitude: number;
          longitude: number;
          address?: string | null;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          estimated_price: number;
          final_price?: number | null;
          commission: number;
          eta?: number | null;
          artisan_latitude?: number | null;
          artisan_longitude?: number | null;
        };
        Update: {
          artisan_id?: string | null;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          final_price?: number | null;
          eta?: number | null;
          artisan_latitude?: number | null;
          artisan_longitude?: number | null;
          accepted_at?: string | null;
          completed_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'mission_request' | 'mission_accepted' | 'mission_completed' | 'payment';
          title: string;
          message: string;
          mission_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'mission_request' | 'mission_accepted' | 'mission_completed' | 'payment';
          title: string;
          message: string;
          mission_id?: string | null;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          mission_id: string;
          client_id: string;
          artisan_id: string;
          amount: number;
          commission: number;
          commission_amount: number;
          artisan_payout: number;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          payment_method_id: string | null;
          failure_reason: string | null;
          created_at: string;
          processed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          client_id: string;
          artisan_id: string;
          amount: number;
          commission: number;
          commission_amount: number;
          artisan_payout: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          payment_method_id?: string | null;
          failure_reason?: string | null;
        };
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          failure_reason?: string | null;
          processed_at?: string | null;
        };
      };
    };
  };
};
