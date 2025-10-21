import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { User, UserType, Artisan, Client, Admin } from '@/types';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import type { Session, AuthError } from '@supabase/supabase-js';



export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession);
        if (currentSession?.user) {
          loadUserProfile(currentSession.user.id);
        } else {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession?.user) {
          loadUserProfile(newSession.user.id);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔵 Loading user profile for ID:', userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('❌ Error fetching user from database:', {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint
        });
        throw userError;
      }
      
      if (!userData) {
        console.error('❌ User not found in database for ID:', userId);
        console.error('⚠️ User exists in auth but not in users table. This might be a schema cache issue.');
        console.error('🔧 Try restarting your Supabase project from the Dashboard.');
        throw new Error('User profile not found. Please contact support.');
      }
      
      console.log('✅ User data fetched:', userData.email, userData.user_type);

      let profile: User;

      if (userData.user_type === 'artisan') {
        const { data: artisanData, error: artisanError } = await supabase
          .from('artisans')
          .select('*')
          .eq('id', userId)
          .single();

        if (artisanError) throw artisanError;

        profile = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          photo: userData.photo,
          type: 'artisan',
          rating: userData.rating,
          reviewCount: userData.review_count,
          category: artisanData.category,
          hourlyRate: artisanData.hourly_rate,
          travelFee: artisanData.travel_fee,
          interventionRadius: artisanData.intervention_radius,
          isAvailable: artisanData.is_available,
          completedMissions: artisanData.completed_missions,
          specialties: artisanData.specialties,
          location: artisanData.latitude && artisanData.longitude
            ? { latitude: artisanData.latitude, longitude: artisanData.longitude }
            : undefined,
          isSuspended: artisanData.is_suspended,
        } as Artisan;
      } else if (userData.user_type === 'client') {
        const { data: paymentMethods } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('client_id', userId);

        profile = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          photo: userData.photo,
          type: 'client',
          rating: userData.rating,
          reviewCount: userData.review_count,
          paymentMethods: (paymentMethods || []).map(pm => ({
            id: pm.id,
            type: pm.type as 'card' | 'paypal',
            last4: pm.last4,
            isDefault: pm.is_default,
          })),
        } as Client;
      } else {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single();

        if (adminError) throw adminError;

        profile = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          photo: userData.photo,
          type: 'admin',
          rating: userData.rating,
          reviewCount: userData.review_count,
          role: adminData.role,
          permissions: adminData.permissions,
        } as Admin;
      }

      setUser(profile);
      console.log('✅✅✅ User profile fully loaded:', profile.name, profile.type);
    } catch (error: any) {
      console.error('❌❌❌ Error loading user profile:');
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message || 'Unknown error');
      console.error('Error code:', error?.code);
      console.error('Error details:', error?.details);
      console.error('Full error:', JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const signUp = async (email: string, password: string, name: string, userType: UserType, additionalData?: Record<string, unknown>) => {
    try {
      console.log('🔵 Starting signup for:', email, userType);
      
      const redirectTo = Linking.createURL('/auth-callback');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (authError) {
        console.error('❌ Supabase Auth Error:', authError);
        
        let errorMessage = authError.message || 'Authentication failed';
        if (errorMessage.includes('User already registered') || authError.message?.includes('already registered')) {
          errorMessage = 'Un compte existe déjà avec cet email';
        }
        
        throw new Error(errorMessage);
      }
      if (!authData.user) {
        console.error('❌ No user returned from auth');
        throw new Error('User creation failed');
      }
      
      console.log('✅ Auth user created with ID:', authData.user.id);

      console.log('🔵 Inserting user profile...');
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        name,
        user_type: userType,
        phone: (additionalData?.phone as string) || null,
        photo: (additionalData?.photo as string) || null,
      });

      if (userError) {
        console.error('❌ User profile insertion error:', userError);
        console.error('Error details:', JSON.stringify(userError, null, 2));
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }
      
      console.log('✅ User profile created');

      if (userType === 'artisan') {
        console.log('🔵 Creating artisan profile...');
        const { error: artisanError } = await supabase.from('artisans').insert({
          id: authData.user.id,
          category: additionalData?.category as string,
          hourly_rate: (additionalData?.hourlyRate as number) || 50,
          travel_fee: (additionalData?.travelFee as number) || 25,
          intervention_radius: (additionalData?.interventionRadius as number) || 20,
          specialties: (additionalData?.specialties as string[]) || [],
        });

        if (artisanError) {
          console.error('❌ Artisan profile error:', artisanError);
          throw new Error(`Failed to create artisan profile: ${artisanError.message}`);
        }
        
        console.log('✅ Artisan profile created');

        console.log('🔵 Creating wallet...');
        const { error: walletError } = await supabase.from('wallets').insert({
          artisan_id: authData.user.id,
          balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          total_withdrawals: 0,
        });

        if (walletError) {
          console.warn('⚠️ Wallet creation failed:', walletError);
        } else {
          console.log('✅ Wallet created');
        }
      } else if (userType === 'client') {
        console.log('🔵 Creating client profile...');
        const { error: clientError } = await supabase.from('clients').insert({
          id: authData.user.id,
        });

        if (clientError) {
          console.error('❌ Client profile error:', clientError);
          throw new Error(`Failed to create client profile: ${clientError.message}`);
        }
        
        console.log('✅ Client profile created');
      } else if (userType === 'admin') {
        console.log('🔵 Creating admin profile...');
        const { error: adminError } = await supabase.from('admins').insert({
          id: authData.user.id,
          role: (additionalData?.role as 'super_admin' | 'moderator') || 'moderator',
          permissions: (additionalData?.permissions as string[]) || [],
        });

        if (adminError) {
          console.error('❌ Admin profile error:', adminError);
          throw new Error(`Failed to create admin profile: ${adminError.message}`);
        }
        
        console.log('✅ Admin profile created');
      }

      console.log('✅✅✅ User signup complete:', email, userType);
      return authData.user;
    } catch (error: any) {
      console.error('❌❌❌ SIGNUP ERROR:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(typeof error === 'string' ? error : 'Failed to create account');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }
      console.log('✅ User signed in:', email);
      return data.user;
    } catch (error: any) {
      console.error('❌ Error signing in:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(typeof error === 'string' ? error : 'Failed to sign in');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: updates.name,
          phone: updates.phone,
          photo: updates.photo,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      if (user.type === 'artisan' && 'hourlyRate' in updates) {
        const { error: artisanError } = await supabase
          .from('artisans')
          .update({
            hourly_rate: (updates as Partial<Artisan>).hourlyRate,
            travel_fee: (updates as Partial<Artisan>).travelFee,
            intervention_radius: (updates as Partial<Artisan>).interventionRadius,
            is_available: (updates as Partial<Artisan>).isAvailable,
            specialties: (updates as Partial<Artisan>).specialties,
          })
          .eq('id', user.id);

        if (artisanError) throw artisanError;
      }

      const updated = { ...user, ...updates };
      setUser(updated);
      console.log('✅ User updated:', updated.name);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    isLoading,
    isInitialized,
    isAuthenticated: !!user && !!session,
    isClient: user?.type === 'client',
    isArtisan: user?.type === 'artisan',
    isAdmin: user?.type === 'admin',
    signUp,
    signIn,
    logout,
    updateUser,
  };
});
