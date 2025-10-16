import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserType, Artisan, Client, Admin } from '@/types';
import { mockArtisans } from '@/mocks/artisans';

const STORAGE_KEY = '@auth_user';

const mockClient: Client = {
  id: 'cli-1',
  name: 'Alexandre Durand',
  email: 'alex.durand@email.com',
  phone: '+33 6 98 76 54 32',
  photo: 'https://i.pravatar.cc/150?img=68',
  type: 'client',
  rating: 4.9,
  reviewCount: 45,
  paymentMethods: [
    { id: 'pm-1', type: 'card', last4: '4242', isDefault: true },
  ],
};

const mockAdmin: Admin = {
  id: 'admin-1',
  name: 'Admin ArtisanNow',
  email: 'admin@artisannow.com',
  phone: '+33 1 23 45 67 89',
  photo: 'https://i.pravatar.cc/150?img=12',
  type: 'admin',
  role: 'super_admin',
  permissions: ['users', 'missions', 'payments', 'stats'],
};

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (type: UserType, userId?: string) => {
    try {
      let userData: User;
      
      if (type === 'client') {
        userData = mockClient;
      } else if (type === 'admin') {
        userData = mockAdmin;
      } else {
        const artisan = userId 
          ? mockArtisans.find(a => a.id === userId) || mockArtisans[0]
          : mockArtisans[0];
        userData = artisan;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      console.log('User logged in:', userData.name, userData.type);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updated = { ...user, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      console.log('User updated:', updated);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isClient: user?.type === 'client',
    isArtisan: user?.type === 'artisan',
    isAdmin: user?.type === 'admin',
    login,
    logout,
    updateUser,
  };
});
