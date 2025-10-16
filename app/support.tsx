import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, MessageCircle, FileText, HelpCircle, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useAnalytics } from '@/contexts/AnalyticsContext';

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: typeof Mail;
  action: () => void;
  color: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  useScreenTracking('support');

  const handleEmail = () => {
    trackEvent('help_requested', { method: 'email' });
    Linking.openURL('mailto:support@artisannow.com?subject=Besoin d\'aide - ArtisanNow');
  };

  const handlePhone = () => {
    trackEvent('help_requested', { method: 'phone' });
    Linking.openURL('tel:+33123456789');
  };

  const handleChat = () => {
    trackEvent('help_requested', { method: 'chat' });
  };

  const handleFAQ = () => {
    trackEvent('help_requested', { method: 'faq' });
  };

  const handleTerms = () => {
    trackEvent('help_requested', { method: 'terms' });
  };

  const handlePrivacy = () => {
    trackEvent('help_requested', { method: 'privacy' });
  };

  const supportOptions: SupportOption[] = [
    {
      id: 'email',
      title: 'Email',
      description: 'support@artisannow.com',
      icon: Mail,
      action: handleEmail,
      color: Colors.primary,
    },
    {
      id: 'phone',
      title: 'Téléphone',
      description: '+33 1 23 45 67 89',
      icon: Phone,
      action: handlePhone,
      color: Colors.secondary,
    },
    {
      id: 'chat',
      title: 'Chat en direct',
      description: 'Disponible 24/7',
      icon: MessageCircle,
      action: handleChat,
      color: '#10B981',
    },
  ];

  const resourceOptions: SupportOption[] = [
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Questions fréquemment posées',
      icon: HelpCircle,
      action: handleFAQ,
      color: '#F59E0B',
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      description: 'Termes et conditions',
      icon: FileText,
      action: handleTerms,
      color: '#6366F1',
    },
    {
      id: 'privacy',
      title: 'Politique de confidentialité',
      description: 'Protection des données',
      icon: FileText,
      action: handlePrivacy,
      color: '#8B5CF6',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Besoin d&apos;aide ?</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>👋 Comment pouvons-nous vous aider ?</Text>
          <Text style={styles.welcomeDescription}>
            Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans l&apos;utilisation d&apos;ArtisanNow.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactez-nous</Text>
          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.action}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <option.icon size={24} color={option.color} strokeWidth={2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <ExternalLink size={20} color={Colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressources</Text>
          {resourceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.action}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <option.icon size={24} color={option.color} strokeWidth={2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <ExternalLink size={20} color={Colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⏰ Heures d&apos;ouverture</Text>
          <Text style={styles.infoText}>Lundi - Vendredi : 9h00 - 18h00</Text>
          <Text style={styles.infoText}>Samedi : 10h00 - 16h00</Text>
          <Text style={styles.infoText}>Dimanche : Fermé</Text>
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteText}>
              Le chat en direct est disponible 24/7 pour les urgences
            </Text>
          </View>
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>ArtisanNow v1.0.0</Text>
          <Text style={styles.versionText}>© 2025 ArtisanNow. Tous droits réservés.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '30',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
  infoNote: {
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  infoNoteText: {
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  versionInfo: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
});
