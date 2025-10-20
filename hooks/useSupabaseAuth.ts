import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import type { User, UserType } from '@/types';

export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession);
        if (currentSession?.user) {
          loadUserProfile(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          if (newSession?.user) {
            await loadUserProfile(newSession.user.id);
          } else {
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!userData) throw new Error('User not found');

      let fullProfile: User;

      if (userData.user_type === 'artisan') {
        const { data: artisanData } = await supabase
          .from('artisans')
          .select('*')
          .eq('id', userId)
          .single();

        if (artisanData) {
          fullProfile = {
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
          } as any;
        }
      } else if (userData.user_type === 'client') {
        const { data: paymentMethods } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('client_id', userId);

        fullProfile = {
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
        } as any;
      } else {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single();

        if (adminData) {
          fullProfile = {
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
          } as any;
        }
      }

      setUser(fullProfile!);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    userType: UserType,
    additionalData?: Record<string, any>
  ) => {
    const redirectTo = Linking.createURL('/auth-callback');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    await supabase.from('users').insert({
      id: authData.user.id,
      email,
      name,
      user_type: userType,
      phone: additionalData?.phone || null,
      photo: additionalData?.photo || null,
    });

    if (userType === 'artisan') {
      await supabase.from('artisans').insert({
        id: authData.user.id,
        category: additionalData?.category,
        hourly_rate: additionalData?.hourlyRate || 50,
        travel_fee: additionalData?.travelFee || 25,
        intervention_radius: additionalData?.interventionRadius || 20,
        specialties: additionalData?.specialties || [],
      });

      await supabase.from('wallets').insert({
        artisan_id: authData.user.id,
      });
    } else if (userType === 'client') {
      await supabase.from('clients').insert({
        id: authData.user.id,
      });
    }

    return authData.user;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  }, []);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => session?.user.id && loadUserProfile(session.user.id),
  };
};
