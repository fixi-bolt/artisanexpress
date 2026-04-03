import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { User, Eye, EyeOff } from 'lucide-react-native';

export function RoleDebugPanel() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { user, isClient, isArtisan, isAdmin, isAuthenticated } = useAuth();

  if (!__DEV__) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
        activeOpacity={0.8}
      >
        {isVisible ? (
          <EyeOff size={20} color={Colors.surface} strokeWidth={2} />
        ) : (
          <Eye size={20} color={Colors.surface} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.debugPanel}>
          <View style={styles.header}>
            <User size={16} color={Colors.text} strokeWidth={2} />
            <Text style={styles.title}>🔍 Debug Rôle Utilisateur</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Authentifié:</Text>
            <Text style={[styles.value, isAuthenticated ? styles.success : styles.error]}>
              {isAuthenticated ? '✅ Oui' : '❌ Non'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Type utilisateur:</Text>
            <Text style={[
              styles.value, 
              styles.bold,
              user?.type === 'client' && styles.clientColor,
              user?.type === 'artisan' && styles.artisanColor,
              user?.type === 'admin' && styles.adminColor,
            ]}>
              {user?.type?.toUpperCase() || 'NON DÉFINI'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>isClient:</Text>
            <Text style={[styles.value, isClient ? styles.success : styles.muted]}>
              {isClient ? '✅' : '❌'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>isArtisan:</Text>
            <Text style={[styles.value, isArtisan ? styles.success : styles.muted]}>
              {isArtisan ? '✅' : '❌'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>isAdmin:</Text>
            <Text style={[styles.value, isAdmin ? styles.success : styles.muted]}>
              {isAdmin ? '✅' : '❌'}
            </Text>
          </View>

          {user && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.label}>ID:</Text>
                <Text style={styles.valueSmall}>{user.id.slice(0, 8)}...</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.valueSmall}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Nom:</Text>
                <Text style={styles.valueSmall}>{user.name}</Text>
              </View>
            </>
          )}

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Si le type n&apos;est pas correct, exécutez le script SQL de correction dans Supabase
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  debugPanel: {
    position: 'absolute',
    top: 120,
    right: 20,
    left: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 9998,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  value: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  valueSmall: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500' as const,
    maxWidth: '60%',
  },
  bold: {
    fontWeight: '800' as const,
    fontSize: 15,
  },
  success: {
    color: Colors.success,
  },
  error: {
    color: Colors.error,
  },
  muted: {
    opacity: 0.3,
  },
  clientColor: {
    color: Colors.primary,
  },
  artisanColor: {
    color: Colors.secondary,
  },
  adminColor: {
    color: '#9B59B6',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.warning + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  warningText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
