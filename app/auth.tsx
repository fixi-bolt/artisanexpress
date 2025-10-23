import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Briefcase, ArrowLeft, Mail, Lock, UserCircle, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { UserType } from '@/types';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, user, isAuthenticated } = useAuth();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'login' | 'signup'>('select');
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

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
  }, [scaleAnim, fadeAnim]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.type === 'admin') {
        router.replace('/(admin)/dashboard' as any);
      } else if (user.type === 'client') {
        router.replace('/(client)/home' as any);
      } else {
        router.replace('/(artisan)/dashboard' as any);
      }
    }
  }, [isAuthenticated, user, loading, router]);

  const handleSelectType = (type: UserType) => {
    setSelectedType(type);
    setMode('signup');
  };

  const handleSignUp = async () => {
    if (!selectedType || !email || !password || !name) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const additionalData: Record<string, unknown> = { phone };

      await signUp(email, password, name, selectedType, additionalData);
      trackEvent('user_logged_in', { userType: selectedType });
      
      setTimeout(() => {
        if (selectedType === 'admin') {
          router.replace('/(admin)/dashboard' as any);
        } else {
          router.replace(selectedType === 'client' ? '/(client)/home' as any : '/(artisan)/dashboard' as any);
        }
      }, 300);
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' ? error : 'Impossible de créer le compte');
      
      if (errorMessage.includes('already registered') || errorMessage.includes('déjà enregistré') || errorMessage.includes('déjà inscrit')) {
        Alert.alert(
          'Compte existant',
          'Un compte existe déjà avec cet email. Voulez-vous vous connecter à la place ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Se connecter', 
              onPress: () => setMode('login')
            }
          ]
        );
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez entrer votre email et mot de passe');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      trackEvent('user_logged_in');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error?.message);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' ? error : 'Email ou mot de passe incorrect');
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMode('select');
    setSelectedType(null);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');

  };

  if (mode === 'select') {
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
              onPress={() => handleSelectType('client')}
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
              onPress={() => handleSelectType('artisan')}
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
          </Animated.View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => setMode('login')}
          >
            <Text style={styles.loginLinkText}>
              Déjà inscrit ? <Text style={styles.loginLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={resetForm}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login' 
              ? 'Connectez-vous pour continuer'
              : `Inscription en tant que ${selectedType === 'client' ? 'Client' : 'Artisan'}`
            }
          </Text>
        </View>

        <View style={styles.formContainer}>
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <UserCircle size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Téléphone (optionnel)"
                placeholderTextColor={Colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}



          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={mode === 'login' ? handleSignIn : handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {loading 
                ? 'Chargement...' 
                : mode === 'login' ? 'Se connecter' : 'Créer mon compte'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'login' 
                ? "Pas encore de compte ? "
                : "Déjà inscrit ? "
              }
              <Text style={styles.switchModeBold}>
                {mode === 'login' ? "S'inscrire" : "Se connecter"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  loginLinkText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  loginLinkBold: {
    fontWeight: '700' as const,
    color: Colors.primary,
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
  formContainer: {
    gap: 16,
    paddingTop: 8,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  switchModeButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchModeText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  switchModeBold: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
