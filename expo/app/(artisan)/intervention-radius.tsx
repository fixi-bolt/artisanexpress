import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Artisan } from '@/types';

const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

export default function InterventionRadiusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const artisan = user?.type === 'artisan' ? (user as Artisan) : null;
  
  const [selectedRadius, setSelectedRadius] = useState<number>(artisan?.interventionRadius || 20);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('artisans')
        .update({ intervention_radius: selectedRadius })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Succès', 'Votre rayon d\'intervention a été mis à jour.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le rayon d\'intervention.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Rayon d'intervention",
          headerShown: true,
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.header}>
          <MapPin size={32} color={Colors.secondary} />
          <Text style={styles.title}>Rayon d&apos;intervention</Text>
          <Text style={styles.subtitle}>
            Choisissez jusqu&apos;où vous êtes prêt à vous déplacer pour vos missions
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {RADIUS_OPTIONS.map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.option,
                selectedRadius === radius && styles.optionSelected,
              ]}
              onPress={() => setSelectedRadius(radius)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  selectedRadius === radius && styles.optionTextSelected,
                ]}>
                  {radius} km
                </Text>
                {selectedRadius === radius && (
                  <View style={styles.checkContainer}>
                    <Check size={20} color={Colors.surface} strokeWidth={3} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Conseil</Text>
          <Text style={styles.infoText}>
            Un rayon plus large augmente vos chances de recevoir des missions, mais pensez aux temps de trajet.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>
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
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  optionSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.surface,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: Colors.secondary + '15',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
