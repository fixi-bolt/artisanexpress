import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AuthContext, useAuth } from '@/contexts/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext>{children}</AuthContext>
);

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

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

    it('should eventually finish loading', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('auth methods', () => {
    it('should have signIn method available', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.signIn).toBeDefined();
      expect(typeof result.current.signIn).toBe('function');
    });

    it('should have signUp method available', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.signUp).toBeDefined();
      expect(typeof result.current.signUp).toBe('function');
    });

    it('should have logout method available', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.logout).toBeDefined();
      expect(typeof result.current.logout).toBe('function');
    });

    it('should validate user roles correctly when no user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.isClient).toBe(false);
      expect(result.current.isArtisan).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should have updateUser method available', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.updateUser).toBeDefined();
      expect(typeof result.current.updateUser).toBe('function');
    });

    it('should throw error when updating with no user logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      await expect(
        result.current.updateUser({ name: 'Should Not Update' })
      ).rejects.toThrow('No user logged in');

      expect(result.current.user).toBeNull();
    });

    it('should have refreshUser method available', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.refreshUser).toBeDefined();
      expect(typeof result.current.refreshUser).toBe('function');
    });
  });

  describe('session management', () => {
    it('should have session property', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect('session' in result.current).toBe(true);
    });
  });
});
