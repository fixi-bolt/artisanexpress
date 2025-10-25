import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { clearAuthState } from '@/utils/clearAuthState';
import Colors from '@/constants/colors';

export function AuthErrorHandler() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        setAuthError(null);
      }
    });

    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          if (error.message?.includes('refresh') || error.message?.includes('token')) {
            setAuthError('Session expirée ou invalide');
          }
        }
      } catch (error: any) {
        if (error?.message?.includes('refresh') || error?.message?.includes('token')) {
          setAuthError('Session expirée ou invalide');
        }
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleClearAuth = async () => {
    setIsClearing(true);
    try {
      await clearAuthState();
      setAuthError(null);
      console.log('✅ Auth state cleared, please restart the app');
    } catch (error) {
      console.error('Error clearing auth:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (!authError) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <AlertTriangle size={32} color={Colors.error} strokeWidth={2} />
        <Text style={styles.title}>Erreur d&apos;authentification</Text>
        <Text style={styles.message}>{authError}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleClearAuth}
          disabled={isClearing}
        >
          <RefreshCw size={20} color={Colors.surface} strokeWidth={2} />
          <Text style={styles.buttonText}>
            {isClearing ? 'Nettoyage...' : 'Réinitialiser'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
