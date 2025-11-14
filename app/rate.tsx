import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMissions } from '@/contexts/MissionContext';
import { mockArtisans } from '@/mocks/artisans';

export default function RateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { missions, completeMission } = useMissions();
  
  const missionId = params.missionId as string;
  const mission = missions.find(m => m.id === missionId);
  const artisan = mission ? mockArtisans.find(a => a.id === mission.artisanId) : null;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Erreur', 'Veuillez donner une note');
      return;
    }

    Keyboard.dismiss();
    
    console.log('Rating submitted:', { missionId, rating, comment });
    
    Alert.alert(
      'Merci !',
      'Votre avis a été enregistré',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  if (!mission || !artisan) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Noter l&apos;artisan</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.artisanCard}>
            <View style={styles.artisanAvatar}>
              <Text style={styles.artisanAvatarText}>
                {artisan.name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.artisanName}>{artisan.name}</Text>
            <Text style={styles.missionTitle}>{mission.title}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Comment s&apos;est passée l&apos;intervention ?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Star
                    size={48}
                    color={star <= rating ? Colors.warning : Colors.border}
                    fill={star <= rating ? Colors.warning : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {getRatingText(rating)}
              </Text>
            )}
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Laissez un commentaire (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={Colors.textLight}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={rating === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              Envoyer l&apos;évaluation
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function getRatingText(rating: number): string {
  switch (rating) {
    case 1:
      return 'Très insatisfait';
    case 2:
      return 'Insatisfait';
    case 3:
      return 'Moyen';
    case 4:
      return 'Satisfait';
    case 5:
      return 'Excellent !';
    default:
      return '';
  }
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  artisanCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  artisanAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  artisanAvatarText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  artisanName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  missionTitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  commentSection: {
    marginBottom: 32,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 120,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
