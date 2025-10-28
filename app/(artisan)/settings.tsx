import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Bell, Lock, Globe, Eye, Shield, Database } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Contactez le support pour supprimer votre compte.');
          }
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Notifications push',
          description: 'Recevoir des notifications pour les nouvelles missions',
          value: notifications,
          onToggle: setNotifications,
        },
      ],
    },
    {
      title: 'Confidentialité',
      items: [
        {
          icon: Globe,
          label: 'Partage de position',
          description: 'Partager ma position pour trouver des missions à proximité',
          value: locationSharing,
          onToggle: setLocationSharing,
        },
        {
          icon: Eye,
          label: 'Visibilité du profil',
          description: 'Être visible par les clients',
          value: profileVisibility,
          onToggle: setProfileVisibility,
        },
      ],
    },
    {
      title: 'Légal',
      items: [
        {
          icon: Shield,
          label: 'Politique de confidentialité',
          onPress: () => Alert.alert('Info', 'Politique de confidentialité'),
        },
        {
          icon: Lock,
          label: 'Conditions d\'utilisation',
          onPress: () => Alert.alert('Info', 'Conditions d\'utilisation'),
        },
      ],
    },
    {
      title: 'Données',
      items: [
        {
          icon: Database,
          label: 'Exporter mes données',
          onPress: () => Alert.alert('Info', 'Export de données en cours de développement'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Paramètres',
          headerShown: true,
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Settings size={32} color={Colors.secondary} />
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>
            Gérez vos préférences et paramètres de compte
          </Text>
        </View>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLast = itemIndex === section.items.length - 1;
                
                return (
                  <View key={itemIndex}>
                    {'onToggle' in item ? (
                      <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
                        <View style={styles.settingLeft}>
                          <View style={styles.iconContainer}>
                            <Icon size={20} color={Colors.secondary} />
                          </View>
                          <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>{item.label}</Text>
                            {item.description && (
                              <Text style={styles.settingDescription}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: Colors.border, true: Colors.secondary }}
                          thumbColor={Colors.surface}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.settingItem, isLast && styles.settingItemLast]}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                      >
                        <View style={styles.settingLeft}>
                          <View style={styles.iconContainer}>
                            <Icon size={20} color={Colors.secondary} />
                          </View>
                          <Text style={styles.settingLabel}>{item.label}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
});
