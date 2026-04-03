import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Artisan } from '@/types';

const SUGGESTED_RATES = [30, 40, 50, 60, 70, 80];

export default function RatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const artisan = user?.type === 'artisan' ? (user as Artisan) : null;
  
  const [hourlyRate, setHourlyRate] = useState<string>(String(artisan?.hourlyRate || 50));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    
    const rate = parseInt(hourlyRate);
    if (isNaN(rate) || rate < 10 || rate > 500) {
      Alert.alert('Erreur', 'Veuillez entrer un tarif entre 10€ et 500€');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('artisans')
        .update({ hourly_rate: rate })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Succès', 'Votre tarif horaire a été mis à jour.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le tarif.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Tarifs',
          headerShown: true,
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.header}>
          <DollarSign size={32} color={Colors.secondary} />
          <Text style={styles.title}>Tarif horaire</Text>
          <Text style={styles.subtitle}>
            Définissez votre tarif horaire pour vos prestations
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Tarif horaire (€)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
              placeholder="50"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.inputSuffix}>€/h</Text>
          </View>
        </View>

        <View style={styles.suggestedContainer}>
          <Text style={styles.suggestedTitle}>Suggestions</Text>
          <View style={styles.suggestedGrid}>
            {SUGGESTED_RATES.map((rate) => (
              <TouchableOpacity
                key={rate}
                style={[
                  styles.suggestedItem,
                  hourlyRate === String(rate) && styles.suggestedItemSelected,
                ]}
                onPress={() => setHourlyRate(String(rate))}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.suggestedText,
                  hourlyRate === String(rate) && styles.suggestedTextSelected,
                ]}>
                  {rate}€
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Conseils tarifaires</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Consultez les tarifs moyens de votre région
            </Text>
            <Text style={styles.infoItem}>
              • Adaptez selon votre expérience
            </Text>
            <Text style={styles.infoItem}>
              • Restez compétitif mais valorisez votre savoir-faire
            </Text>
            <Text style={styles.infoItem}>
              • Vous pourrez modifier ce tarif à tout moment
            </Text>
          </View>
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
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  inputSuffix: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  suggestedContainer: {
    marginBottom: 24,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestedItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  suggestedItemSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '15',
  },
  suggestedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestedTextSelected: {
    color: Colors.secondary,
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
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
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
