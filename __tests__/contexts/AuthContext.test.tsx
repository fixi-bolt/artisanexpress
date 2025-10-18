import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthContext, useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext>{children}</AuthContext>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should load user from storage if exists', async () => {
      const mockUser = {
        id: 'cli-1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+33 6 00 00 00 00',
        photo: 'https://example.com/photo.jpg',
        type: 'client' as const,
        rating: 4.5,
        reviewCount: 10,
        paymentMethods: [],
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('login', () => {
    it('should login as client successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('client');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.type).toBe('client');
      expect(result.current.isClient).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should login as artisan successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('artisan');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.type).toBe('artisan');
      expect(result.current.isArtisan).toBe(true);
    });

    it('should login as admin successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('admin');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.type).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('client');
      });

      expect(result.current.user).toBeTruthy();

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('client');
      });

      const initialName = result.current.user?.name;

      await act(async () => {
        await result.current.updateUser({ name: 'Updated Name' });
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.user?.name).not.toBe(initialName);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should not update if no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateUser({ name: 'Should Not Update' });
      });

      expect(result.current.user).toBeNull();
    });
  });
});
