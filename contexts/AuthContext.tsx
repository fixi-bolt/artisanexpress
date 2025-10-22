import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserType, Artisan, Client, Admin } from '@/types';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

const __DEV__ = process.env.NODE_ENV !== 'production';

const logger = {
  info: (...args: any[]) => __DEV__ && console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const loadUserProfile = useCallback(async (userId: string, retryCount = 0) => {
    if (retryCount > 2) {
      logger.error('❌ Failed to load user profile after 3 attempts');
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      logger.info('🔵 Loading user profile for ID:', userId, `(attempt ${retryCount + 1})`);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        logger.error('❌ Error fetching user from database:', {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint
        });
        throw userError;
      }
      
      if (!userData) {
        logger.error('❌ User not found in database for ID:', userId);
        
        if (retryCount === 0) {
          logger.info('🔄 Waiting for user profile to be created...');
          const exists = await waitForProfile(userId);
          if (exists) {
            await loadUserProfile(userId, retryCount + 1);
            return;
          }
        }
        
        throw new Error('User profile not found. Please contact support.');
      }
      
      logger.info('✅ User data fetched:', userData.email, userData.user_type);

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
      logger.info('✅ User profile fully loaded:', profile.name, profile.type);
    } catch (error: any) {
      logger.error('❌ Error loading user profile:');
      logger.error('Error message:', error?.message || 'Unknown error');
      if (__DEV__) {
        logger.error('Error details:', { code: error?.code, details: error?.details });
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

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
  }, [loadUserProfile]);

  const waitForProfile = async (userId: string, maxAttempts = 10): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) return true;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return false;
  };

  const signUp = useCallback(async (email: string, password: string, name: string, userType: UserType, additionalData?: Record<string, unknown>) => {
    let authData: any = null;
    
    try {
      logger.info('🔵 Starting signup for:', email, userType);
      
      const redirectTo = Linking.createURL('/auth-callback');

      const result = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      
      authData = result;
      const authError = result.error;

      if (authError) {
        logger.error('❌ Supabase Auth Error:', authError);
        
        let errorMessage = authError.message || 'Authentication failed';
        if (errorMessage.includes('User already registered') || authError.message?.includes('already registered')) {
          errorMessage = 'Un compte existe déjà avec cet email';
        }
        
        throw new Error(errorMessage);
      }
      if (!authData?.data?.user) {
        logger.error('❌ No user returned from auth');
        throw new Error('User creation failed');
      }
      
      logger.info('✅ Auth user created with ID:', authData.data.user.id);

      logger.info('🔵 Inserting user profile...');
      const { error: userError } = await supabase.from('users').insert({
        id: authData.data.user.id,
        email,
        name,
        user_type: userType,
        phone: (additionalData?.phone as string) || null,
        photo: (additionalData?.photo as string) || null,
      });

      if (userError) {
        logger.error('❌ User profile insertion error:', userError);
        if (__DEV__) {
          logger.error('Error details:', JSON.stringify(userError, null, 2));
        }
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }
      
      logger.info('✅ User profile created');
      
      const profileExists = await waitForProfile(authData.data.user.id);
      if (!profileExists) {
        throw new Error('Failed to create user profile');
      }

      if (userType === 'artisan') {
        logger.info('🔵 Creating artisan profile...');
        const { error: artisanError } = await supabase.from('artisans').insert({
          id: authData.data.user.id,
          category: (additionalData?.category as string) ?? 'Non spécifié',
          hourly_rate: (additionalData?.hourlyRate as number) || 50,
          travel_fee: (additionalData?.travelFee as number) || 25,
          intervention_radius: (additionalData?.interventionRadius as number) || 20,
          specialties: (additionalData?.specialties as string[]) || [],
        });

        if (artisanError) {
          logger.error('❌ Artisan profile error:', artisanError);
          throw new Error(`Failed to create artisan profile: ${artisanError.message}`);
        }
        
        logger.info('✅ Artisan profile created');

        logger.info('🔵 Creating wallet...');
        const { error: walletError } = await supabase.from('wallets').insert({
          artisan_id: authData.data.user.id,
          balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          total_withdrawals: 0,
        });

        if (walletError) {
          logger.error('⚠️ Wallet creation failed:', walletError);
        } else {
          logger.info('✅ Wallet created');
        }
      } else if (userType === 'client') {
        logger.info('🔵 Creating client profile...');
        const { error: clientError } = await supabase.from('clients').insert({
          id: authData.data.user.id,
        });

        if (clientError) {
          logger.error('❌ Client profile error:', clientError);
          throw new Error(`Failed to create client profile: ${clientError.message}`);
        }
        
        logger.info('✅ Client profile created');
      } else if (userType === 'admin') {
        logger.info('🔵 Creating admin profile...');
        const { error: adminError } = await supabase.from('admins').insert({
          id: authData.data.user.id,
          role: (additionalData?.role as 'super_admin' | 'moderator') || 'moderator',
          permissions: (additionalData?.permissions as string[]) || [],
        });

        if (adminError) {
          logger.error('❌ Admin profile error:', adminError);
          throw new Error(`Failed to create admin profile: ${adminError.message}`);
        }
        
        logger.info('✅ Admin profile created');
      }

      logger.info('✅ User signup complete:', email, userType);
      return authData.data.user;
    } catch (error: any) {
      logger.error('❌ SIGNUP ERROR:', error?.message);
      
      if (authData?.data?.user) {
        logger.info('🔄 Cleaning up failed signup...');
        await supabase.auth.signOut();
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(typeof error === 'string' ? error : 'Failed to create account');
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
        }
        throw new Error(errorMessage);
      }
      logger.info('✅ User signed in:', email);
      return data.user;
    } catch (error: any) {
      logger.error('❌ Error signing in:', error?.message);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(typeof error === 'string' ? error : 'Failed to sign in');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error('❌ Supabase signOut error:', error);
        }
      } else {
        logger.info('ℹ️ No active session to sign out from');
      }
      
      setUser(null);
      setSession(null);
      logger.info('✅ User logged out');
    } catch (error) {
      logger.error('❌ Error during logout:', error);
      setUser(null);
      setSession(null);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
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
      logger.info('✅ User updated:', updated.name);
    } catch (error) {
      logger.error('❌ Error updating user:', error);
      throw error;
    }
  }, [user]);

  return useMemo(() => ({
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
  }), [user, session, isLoading, isInitialized, signUp, signIn, logout, updateUser]);
});
