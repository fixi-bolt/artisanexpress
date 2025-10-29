import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mxlxwqhkodgixztnydzd.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bHh3cWhrb2RnaXh6dG55ZHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDQyNDEsImV4cCI6MjA1MzgyMDI0MX0.IKvmfNLVXR5BtoCPkWNOyZXFczuUTPqLbNKiKQU4KPc';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials missing!');
  throw new Error('Supabase URL and key are required');
}

console.log('🔧 Supabase Config:');
console.log('  URL:', SUPABASE_URL);
console.log('  Key:', `${SUPABASE_ANON_KEY.substring(0, 10)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 4)}`);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' ? true : false,
  },
  global: {
    fetch: async (url, options = {}) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        console.error('❌ Supabase fetch error:', error.message);
        console.error('  URL:', url);
        console.error('  Error type:', error.name);
        
        if (error.name === 'AbortError') {
          throw new Error('La connexion a expiré. Vérifiez votre connexion Internet.');
        }
        
        if (error.message?.includes('Network request failed')) {
          throw new Error('Erreur de connexion. Vérifiez votre connexion Internet et réessayez.');
        }
        
        throw error;
      }
    },
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
