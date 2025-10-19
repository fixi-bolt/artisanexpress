import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { User, UserType, Artisan, Client, Admin } from '@/types';
import { supabase } from '@/lib/supabase';
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

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
      console.log('✅ User profile loaded:', profile.name, profile.type);
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const signUp = async (email: string, password: string, name: string, userType: UserType, additionalData?: Record<string, unknown>) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        name,
        user_type: userType,
        phone: (additionalData?.phone as string) || null,
        photo: (additionalData?.photo as string) || null,
      });

      if (userError) throw userError;

      if (userType === 'artisan') {
        const { error: artisanError } = await supabase.from('artisans').insert({
          id: authData.user.id,
          category: additionalData?.category as string,
          hourly_rate: (additionalData?.hourlyRate as number) || 50,
          travel_fee: (additionalData?.travelFee as number) || 25,
          intervention_radius: (additionalData?.interventionRadius as number) || 20,
          specialties: (additionalData?.specialties as string[]) || [],
        });

        if (artisanError) throw artisanError;

        const { error: walletError } = await supabase.from('wallets').insert({
          artisan_id: authData.user.id,
          balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          total_withdrawals: 0,
        });

        if (walletError) console.warn('Wallet creation failed:', walletError);
      } else if (userType === 'client') {
        const { error: clientError } = await supabase.from('clients').insert({
          id: authData.user.id,
        });

        if (clientError) throw clientError;
      } else if (userType === 'admin') {
        const { error: adminError } = await supabase.from('admins').insert({
          id: authData.user.id,
          role: (additionalData?.role as 'super_admin' | 'moderator') || 'moderator',
          permissions: (additionalData?.permissions as string[]) || [],
        });

        if (adminError) throw adminError;
      }

      console.log('✅ User signed up:', email, userType);
      return authData.user;
    } catch (error) {
      console.error('❌ Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log('✅ User signed in:', email);
      return data.user;
    } catch (error) {
      console.error('❌ Error signing in:', error);
      throw error;
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
