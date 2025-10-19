import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ejjlaccuauzdempjktpt.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqamxhY2N1YXV6ZGVtcGprdHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQwOTIsImV4cCI6MjA3NjQ2MDA5Mn0.lBGJOIiBzkr5-0EsA4lMvBk84L77fsedlK-CujoD5vk';

console.log('🔧 Supabase Config Check:');
console.log('  URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('  Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ SUPABASE NOT CONFIGURED!');
  console.error('❌ Please ensure .env file has:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://ejjlaccuauzdempjktpt.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.error('\n❌ Then restart with: npx expo start --clear\n');
  throw new Error('Supabase configuration is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
