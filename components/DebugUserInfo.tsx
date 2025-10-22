import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

/**
 * Composant de débogage pour afficher les informations de l'utilisateur connecté
 * À utiliser temporairement pour vérifier que la redirection fonctionne correctement
 * 
 * Usage:
 * import { DebugUserInfo } from '@/components/DebugUserInfo';
 * 
 * <DebugUserInfo />
 */
export function DebugUserInfo() {
  const { user, isClient, isArtisan } = useAuth();

  if (!user) {
    return null;
  }

  const roleInfo = {
    color: isClient ? Colors.primary : isArtisan ? Colors.secondary : Colors.warning,
    label: isClient ? 'CLIENT' : isArtisan ? 'ARTISAN' : 'ADMIN',
    emoji: isClient ? '👤' : isArtisan ? '🔧' : '👑',
  };

  return (
    <View style={[styles.container, { borderLeftColor: roleInfo.color }]}>
      <View style={[styles.badge, { backgroundColor: roleInfo.color }]}>
        <Text style={styles.badgeText}>
          {roleInfo.emoji} {roleInfo.label}
        </Text>
      </View>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.id}>ID: {user.id.substring(0, 8)}...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    margin: 16,
    borderLeftWidth: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.surface,
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  name: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  id: {
    fontSize: 10,
    color: Colors.textLight,
    fontFamily: 'monospace' as any,
  },
});
