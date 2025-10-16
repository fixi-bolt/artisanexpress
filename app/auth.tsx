import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Briefcase, ArrowLeft, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async (type: 'client' | 'artisan' | 'admin') => {
    setLoading(true);
    await login(type);
    trackEvent('user_logged_in', { userType: type });
    setTimeout(() => {
      if (type === 'admin') {
        router.replace('/(admin)/dashboard' as any);
      } else {
        router.replace(type === 'client' ? '/(client)/home' as any : '/(artisan)/dashboard' as any);
      }
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Qui êtes-vous ?</Text>
          <Text style={styles.subtitle}>
            Choisissez votre profil pour continuer
          </Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.cardsContainer,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleLogin('client')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
              <User size={40} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Je suis un Client</Text>
            <Text style={styles.cardDescription}>
              J&apos;ai besoin d&apos;un artisan pour une intervention
            </Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>Demander un artisan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleLogin('artisan')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.secondary + '20' }]}>
              <Briefcase size={40} color={Colors.secondary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Je suis un Artisan</Text>
            <Text style={styles.cardDescription}>
              Je souhaite accepter des missions et gagner de l&apos;argent
            </Text>
            <View style={[styles.cardBadge, { backgroundColor: Colors.secondary }]}>
              <Text style={styles.cardBadgeText}>Accepter des missions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleLogin('admin')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
              <Shield size={40} color="#8B5CF6" strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Je suis Admin</Text>
            <Text style={styles.cardDescription}>
              Accès au dashboard administrateur pour gérer la plateforme
            </Text>
            <View style={[styles.cardBadge, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.cardBadgeText}>Accéder au dashboard</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          style={[
            styles.infoContainer,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.infoText}>
            En continuant, vous acceptez nos Conditions d&apos;utilisation et notre Politique de confidentialité
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cardBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
