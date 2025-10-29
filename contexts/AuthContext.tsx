import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, UserType, Artisan, Client, Admin } from '@/types';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { clearAuthState } from '@/utils/clearAuthState';

const __DEV__ = process.env.NODE_ENV !== 'production';

const logger = {
  info: (...args: any[]) => __DEV__ && console.log('🔵', ...args),
  warn: (...args: any[]) => __DEV__ && console.warn('⚠️', ...args),
  error: (...args: any[]) => console.error('❌', ...args),
  success: (...args: any[]) => __DEV__ && console.log('✅', ...args),
};

// Database types
type DbUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photo?: string;
  avatar_url?: string;
  user_type: UserType;
  rating: number;
  review_count: number;
  address?: string;
  city?: string;
  postal_code?: string;
};

type DbArtisan = {
  id: string;
  category: string; // Database stores as string, will be cast to ArtisanCategory
  hourly_rate: number;
  travel_fee: number;
  intervention_radius: number;
  is_available: boolean;
  completed_missions: number;
  specialties: string[];
  latitude?: number;
  longitude?: number;
  is_suspended: boolean;
  is_verified?: boolean;
  company_name?: string;
  siret?: string;
};

type DbAdmin = {
  id: string;
  role: 'super_admin' | 'moderator';
  permissions: string[];
};

// Helper function to wait for profile creation
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

// Helper functions to create user objects
const createArtisanUser = (userData: DbUser, artisanData: DbArtisan): Artisan => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  phone: userData.phone || '',
  photo: userData.avatar_url || userData.photo,
  type: 'artisan',
  rating: userData.rating || 0,
  reviewCount: userData.review_count || 0,
  category: artisanData.category as import('@/types').ArtisanCategory,
  hourlyRate: artisanData.hourly_rate,
  travelFee: artisanData.travel_fee,
  interventionRadius: artisanData.intervention_radius,
  isAvailable: artisanData.is_available,
  completedMissions: artisanData.completed_missions,
  specialties: artisanData.specialties || [],
  location: artisanData.latitude && artisanData.longitude
    ? { latitude: artisanData.latitude, longitude: artisanData.longitude }
    : undefined,
  isSuspended: artisanData.is_suspended,
});

const createClientUser = (userData: DbUser, paymentMethods: any[]): Client => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  phone: userData.phone || '',
  photo: userData.avatar_url || userData.photo,
  type: 'client',
  rating: userData.rating || 0,
  reviewCount: userData.review_count || 0,
  paymentMethods: paymentMethods.map(pm => ({
    id: pm.id,
    type: pm.type as 'card' | 'paypal',
    last4: pm.last4,
    isDefault: pm.is_default,
  })),
});

const createAdminUser = (userData: DbUser, adminData: DbAdmin): Admin => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  phone: userData.phone || '',
  photo: userData.avatar_url || userData.photo,
  type: 'admin',
  rating: userData.rating || 0,
  reviewCount: userData.review_count || 0,
  role: adminData.role,
  permissions: adminData.permissions,
});

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Track loading profiles to prevent race conditions
  const loadingProfiles = useRef<Set<string>>(new Set());

  const loadUserProfile = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    // Prevent race conditions
    if (loadingProfiles.current.has(userId)) {
      logger.info('Profile already loading for:', userId);
      return;
    }

    if (retryCount > 2) {
      logger.error('Failed to load user profile after 3 attempts');
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    loadingProfiles.current.add(userId);

    try {
      logger.info('Loading user profile for ID:', userId, `(attempt ${retryCount + 1})`);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        logger.error('Error fetching user from database:', userError.message);
        throw userError;
      }
      
      if (!userData) {
        logger.warn('User not found in database for ID:', userId);
        
        if (retryCount === 0) {
          logger.info('Waiting for user profile to be created...');
          const exists = await waitForProfile(userId);
          if (exists) {
            loadingProfiles.current.delete(userId);
            await loadUserProfile(userId, retryCount + 1);
            return;
          }
        }
        
        throw new Error('User profile not found');
      }
      
      logger.success('User data fetched:', userData.email, userData.user_type);

      let profile: User;

      switch (userData.user_type) {
        case 'artisan': {
          const { data: artisanData, error: artisanError } = await supabase
            .from('artisans')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (artisanError) throw artisanError;

          if (!artisanData) {
            logger.warn('Artisan profile not found, creating default...');
            const { error: createError } = await supabase.from('artisans').insert({
              id: userId,
              category: 'Non spécifié',
              hourly_rate: 50,
              travel_fee: 25,
              intervention_radius: 20,
              is_available: true,
            }).select().single();

            if (createError) throw createError;
            
            const { data: newArtisanData } = await supabase
              .from('artisans')
              .select('*')
              .eq('id', userId)
              .single();
            
            profile = createArtisanUser(userData as DbUser, newArtisanData as DbArtisan);
          } else {
            profile = createArtisanUser(userData as DbUser, artisanData as DbArtisan);
          }
          break;
        }

        case 'client': {
          const { data: paymentMethods } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('client_id', userId);

          profile = createClientUser(userData as DbUser, paymentMethods || []);
          break;
        }

        case 'admin': {
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (adminError) throw adminError;

          if (!adminData) {
            logger.warn('Admin profile not found, creating default...');
            const { error: createError } = await supabase.from('admins').insert({
              id: userId,
              role: 'moderator',
              permissions: [],
            }).select().single();

            if (createError) throw createError;
            
            const { data: newAdminData } = await supabase
              .from('admins')
              .select('*')
              .eq('id', userId)
              .single();
            
            profile = createAdminUser(userData as DbUser, newAdminData as DbAdmin);
          } else {
            profile = createAdminUser(userData as DbUser, adminData as DbAdmin);
          }
          break;
        }

        default:
          logger.error('Unknown user type:', userData.user_type);
          throw new Error(`Unknown user type: ${userData.user_type}`);
      }

      setUser(profile);
      logger.success('User profile fully loaded:', profile.name, profile.type);
      
    } catch (error: any) {
      logger.error('Error loading user profile:', error?.message);
      
      if (retryCount < 2) {
        logger.info('Retrying profile load...');
        loadingProfiles.current.delete(userId);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        await loadUserProfile(userId, retryCount + 1);
        return;
      }
      
      setUser(null);
    } finally {
      loadingProfiles.current.delete(userId);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialLoad = true;
    const timeout = setTimeout(() => {
      if (mounted && !isInitialized) {
        logger.warn('⏱️  Auth initialization timeout - forcing ready state');
        setIsLoading(false);
        setIsInitialized(true);
      }
    }, 3000);
    
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (mounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            loadUserProfile(currentSession.user.id);
          } else {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      })
      .catch(async (error) => {
        logger.error('Error getting session:', error?.message);
        
        if (error?.message?.includes('refresh') || error?.message?.includes('token')) {
          logger.warn('🔄 Invalid session detected, clearing auth state...');
          await clearAuthState();
        }
        
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      if (initialLoad) {
        initialLoad = false;
        return;
      }
      
      if (event === 'TOKEN_REFRESHED') {
        logger.info('🔄 Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT') {
        logger.info('👋 User signed out');
        setUser(null);
        setSession(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }
      
      setSession(newSession);
      if (newSession?.user) {
        loadUserProfile(newSession.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadUserProfile, isInitialized]);



  const signUp = useCallback(async (email: string, password: string, name: string, userType: UserType, additionalData?: Record<string, unknown>) => {
    let createdUserId: string | null = null;
    let profileCreationFailed = false;
    
    try {
      logger.info('Starting signup for:', email, userType);
      
      const redirectTo = Linking.createURL('/auth-callback');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: redirectTo,
          data: {
            user_type: userType,
            name,
            ...additionalData
          }
        },
      });

      if (authError) {
        let errorMessage = authError.message;
        if (authError.message?.includes('already registered')) {
          errorMessage = 'Un compte existe déjà avec cet email';
        } else if (authError.message?.includes('password')) {
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
        }
        throw new Error(errorMessage);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }
      
      createdUserId = authData.user.id;
      logger.success('Auth user created with ID:', createdUserId);

      // Wait for trigger to create user profile
      const profileExists = await waitForProfile(createdUserId);
      if (!profileExists) {
        logger.info('Creating user profile manually...');
        const { error: userError } = await supabase.from('users').insert({
          id: createdUserId,
          email,
          name,
          user_type: userType,
          phone: (additionalData?.phone as string) || null,
          avatar_url: (additionalData?.photo as string) || null,
        });

        if (userError) {
          logger.error('User profile creation failed:', userError.message);
          throw new Error(`Failed to create user profile: ${userError.message}`);
        }
      }

      logger.success('User profile created');

      // Create type-specific profiles
      if (userType === 'artisan') {
        logger.info('Creating artisan profile...');
        const { error: artisanError } = await supabase.from('artisans').insert({
          id: createdUserId,
          category: (additionalData?.category as string) ?? 'Non spécifié',
          hourly_rate: (additionalData?.hourlyRate as number) || 50,
          travel_fee: (additionalData?.travelFee as number) || 25,
          intervention_radius: (additionalData?.interventionRadius as number) || 20,
          specialties: (additionalData?.specialties as string[]) || [],
        });

        if (artisanError) {
          logger.warn('Artisan profile creation failed:', artisanError.message);
          logger.warn('Will be created on first login');
          profileCreationFailed = true;
        } else {
          logger.success('Artisan profile created');
        }

        // Create wallet
        const { error: walletError } = await supabase.from('wallets').insert({
          artisan_id: createdUserId,
          balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          total_withdrawals: 0,
          currency: 'EUR',
        });

        if (walletError) {
          logger.warn('Wallet creation failed:', walletError.message);
        } else {
          logger.success('Wallet created');
        }

      } else if (userType === 'client') {
        logger.info('Creating client profile...');
        const { error: clientError } = await supabase.from('clients').insert({
          id: createdUserId,
        });

        if (clientError) {
          logger.warn('Client profile creation failed:', clientError.message);
          logger.warn('Will be created on first login');
          profileCreationFailed = true;
        } else {
          logger.success('Client profile created');
        }

      } else if (userType === 'admin') {
        logger.info('Creating admin profile...');
        const { error: adminError } = await supabase.from('admins').insert({
          id: createdUserId,
          role: (additionalData?.role as 'super_admin' | 'moderator') || 'moderator',
          permissions: (additionalData?.permissions as string[]) || [],
        });

        if (adminError) {
          logger.error('Admin profile creation failed:', adminError.message);
          throw new Error(`Failed to create admin profile: ${adminError.message}`);
        }
        
        logger.success('Admin profile created');
      }

      if (profileCreationFailed) {
        logger.warn('⚠️ Signup completed with warnings - some profiles will be created on first login');
      } else {
        logger.success('User signup complete:', email, userType);
      }

      return authData.user;
      
    } catch (error: any) {
      logger.error('SIGNUP ERROR:', error.message);
      
      // Cleanup on error - sign out the created user
      if (createdUserId) {
        logger.info('Cleaning up failed signup...');
        await supabase.auth.signOut();
      }
      
      throw error;
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

      if (!data.user) {
        throw new Error('Login failed');
      }

      logger.success('User signed in:', email);
      return data.user;
    } catch (error: any) {
      logger.error('Error signing in:', error?.message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Try to sign out from Supabase, but don't fail if network is down
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      // Only log non-network errors
      if (error && !error.message?.includes('session') && !error.message?.includes('refresh') && !error.message?.includes('Network')) {
        logger.error('SignOut error:', error.message);
      }
    } catch (error: any) {
      // Silently handle network errors during logout
      if (!error?.message?.includes('Network')) {
        logger.warn('Error during logout:', error?.message);
      }
    } finally {
      // Always clear local state regardless of network errors
      await clearAuthState();
      setUser(null);
      setSession(null);
      logger.success('User logged out');
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Update base user data
      const userUpdates: any = {};
      if (updates.name !== undefined) userUpdates.name = updates.name;
      if (updates.phone !== undefined) userUpdates.phone = updates.phone;
      if (updates.photo !== undefined) userUpdates.avatar_url = updates.photo;

      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id);

        if (userError) throw userError;
      }

      // Update type-specific data
      if (user.type === 'artisan' && 'hourlyRate' in updates) {
        const artisanUpdates: any = {};
        const artisanUpdate = updates as Partial<Artisan>;
        
        if (artisanUpdate.hourlyRate !== undefined) artisanUpdates.hourly_rate = artisanUpdate.hourlyRate;
        if (artisanUpdate.travelFee !== undefined) artisanUpdates.travel_fee = artisanUpdate.travelFee;
        if (artisanUpdate.interventionRadius !== undefined) artisanUpdates.intervention_radius = artisanUpdate.interventionRadius;
        if (artisanUpdate.isAvailable !== undefined) artisanUpdates.is_available = artisanUpdate.isAvailable;
        if (artisanUpdate.specialties !== undefined) artisanUpdates.specialties = artisanUpdate.specialties;
        if (artisanUpdate.category !== undefined) artisanUpdates.category = artisanUpdate.category;

        if (Object.keys(artisanUpdates).length > 0) {
          const { error: artisanError } = await supabase
            .from('artisans')
            .update(artisanUpdates)
            .eq('id', user.id);

          if (artisanError) throw artisanError;
        }
      }

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      logger.success('User updated:', updatedUser.name);
      
    } catch (error: any) {
      logger.error('Error updating user:', error.message);
      throw error;
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    await loadUserProfile(user.id);
  }, [user, loadUserProfile]);

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
    refreshUser,
  }), [user, session, isLoading, isInitialized, signUp, signIn, logout, updateUser, refreshUser]);
});
