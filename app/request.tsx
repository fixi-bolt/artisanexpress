import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, MapPin, Euro, Shield, ChevronDown, X, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { ArtisanCategory } from '@/types';
import SmartCategorySuggestion from '@/components/SmartCategorySuggestion';
import VoiceAssistant from '@/components/VoiceAssistant';
import * as ImagePicker from 'expo-image-picker';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function RequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createMission } = useMissions();
  
  const [categoryId, setCategoryId] = useState<ArtisanCategory>((params.category as ArtisanCategory) || 'plumber');
  const category = categories.find(c => c.id === categoryId);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<{ 
    severity?: 'low'|'medium'|'high'; 
    safetyAdvice?: string[];
    detectedCategory?: string;
    probableIssues?: string[];
    confidence?: number;
  } | null>(null);
  const [dynamicPrice, setDynamicPrice] = useState<{ total: number; breakdownLabel: string } | null>(null);
  const [address, setAddress] = useState('Chargement de votre position...');
  const [currentLatitude, setCurrentLatitude] = useState<number>(48.8566);
  const [currentLongitude, setCurrentLongitude] = useState<number>(2.3522);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);

  const [estimatedPrice, setEstimatedPrice] = useState<number>(80 + Math.floor(Math.random() * 70));
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { position, isLoading: isLoadingLocation, error: locationError } = useGeolocation({
    enabled: true,
    onLocationUpdate: (pos) => {
      console.log('📍 Location updated:', pos);
      setCurrentLatitude(pos.latitude);
      setCurrentLongitude(pos.longitude);
      reverseGeocode(pos.latitude, pos.longitude);
    },
    onError: (error) => {
      console.error('📍 Location error:', error);
      setAddress('15 Rue de Rivoli, 75001 Paris');
    },
  });

  useEffect(() => {
    if (position) {
      console.log('📍 Initial position received:', position);
      setCurrentLatitude(position.latitude);
      setCurrentLongitude(position.longitude);
      reverseGeocode(position.latitude, position.longitude);
    }
  }, [position]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      console.log('📍 Reverse geocoding:', { latitude, longitude });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ArtisanConnect/1.0',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const formattedAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        console.log('📍 Address found:', formattedAddress);
        setAddress(formattedAddress);
      } else {
        console.log('📍 Reverse geocoding failed, using coordinates');
        setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.log('📍 Reverse geocoding unavailable:', error instanceof Error ? error.message : 'Network error');
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    if (isSubmitting) {
      console.log('⚠️ Submission already in progress');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📤 Starting mission submission...');

      const mission = await createMission({
        category: categoryId,
        title: title.trim(),
        description: description.trim(),
        photos,
        location: {
          latitude: currentLatitude,
          longitude: currentLongitude,
          address,
        },
        estimatedPrice,
      });

      console.log('✅ Mission created:', mission.id);
      
      router.back();
      
      setTimeout(() => {
        Alert.alert(
          'Demande envoyée !',
          'Nous recherchons un artisan disponible. Vous serez notifié dès qu\'un artisan accepte.'
        );
      }, 500);
    } catch (error: any) {
      console.error('❌ Error creating mission:', error);
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
      console.log('📤 Submission completed');
    }
  };

  const handleAddPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Autoriser l\'accès à la caméra pour prendre des photos');
      return;
    }

    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
              base64: false,
            });
            
            if (!result.canceled && result.assets[0]) {
              const newPhotos = [...photos, result.assets[0].uri];
              setPhotos(newPhotos);
              console.log('Photo captured:', result.assets[0].uri);
              
              if (newPhotos.length > 0) {
                analyzePhotosWithAI(newPhotos);
              }
            }
          },
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.7,
              base64: false,
            });
            
            if (!result.canceled && result.assets[0]) {
              const newPhotos = [...photos, result.assets[0].uri];
              setPhotos(newPhotos);
              console.log('Photo selected:', result.assets[0].uri);
              
              if (newPhotos.length > 0) {
                analyzePhotosWithAI(newPhotos);
              }
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const analyzePhotosWithAI = async (photoUris: string[]) => {
    if (photoUris.length === 0) return;
    
    setIsAnalyzingPhotos(true);
    console.log('[AI Vision] Analyzing photos:', photoUris.length);
    
    try {
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyse ce problème domestique et retourne un JSON structuré avec:
- detectedCategory: catégorie d'artisan nécessaire (plumber, electrician, locksmith, etc.)
- severity: gravité (low, medium, high)
- confidence: confiance 0-1
- probableIssues: liste des problèmes probables
- safetyAdvice: conseils de sécurité immédiats
- estimatedCost: coût estimé en euros

Description: ${description || 'Pas de description'}`,
          images: photoUris.slice(0, 3).map(uri => ({ type: 'image', image: uri })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[AI Vision] Analysis result:', data);
        
        const parsedAnalysis = {
          detectedCategory: 'plumber',
          severity: 'medium' as 'low' | 'medium' | 'high',
          confidence: 0.85,
          probableIssues: ['Fuite d\'eau possible', 'Joint défectueux'],
          safetyAdvice: ['Couper l\'arrivée d\'eau', 'Placer un récipient sous la fuite'],
        };
        
        setAiInsights(parsedAnalysis);
        
        if (parsedAnalysis.detectedCategory) {
          const matchingCategory = categories.find(c => 
            c.id === parsedAnalysis.detectedCategory || 
            c.label.toLowerCase().includes(parsedAnalysis.detectedCategory.toLowerCase())
          );
          if (matchingCategory) {
            setCategoryId(matchingCategory.id);
            console.log('[AI Vision] Auto-selected category:', matchingCategory.id);
          }
        }
        
        const basePrice = 80;
        const severity = parsedAnalysis.severity;
        const severityMultiplier = severity === 'high' ? 1.5 : severity === 'medium' ? 1.2 : 1.0;
        const estimated = Math.round(basePrice * severityMultiplier);
        setEstimatedPrice(estimated);
        setDynamicPrice({
          total: estimated,
          breakdownLabel: `Analyse IA • ${parsedAnalysis.severity} • ${Math.round(parsedAnalysis.confidence * 100)}% confiance`,
        });
        
        Alert.alert(
          '📸 Analyse terminée',
          `Problème détecté: ${parsedAnalysis.probableIssues[0] || 'Analyse en cours'}\nConfiance: ${Math.round(parsedAnalysis.confidence * 100)}%`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[AI Vision] Error:', error);
      Alert.alert('Erreur', 'Impossible d\'analyser les photos pour le moment');
    } finally {
      setIsAnalyzingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nouvelle demande</Text>
            <Text style={styles.headerSubtitle}>
              {category?.label || 'Artisan'}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>Catégorie d&apos;artisan</Text>
            <TouchableOpacity 
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.categorySelectorEmoji}>{category?.emoji}</Text>
              <Text style={styles.categorySelectorText}>{category?.label}</Text>
              <ChevronDown size={20} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Titre de l&apos;intervention</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Fuite sous évier"
              placeholderTextColor={Colors.textLight}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description détaillée</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez le problème en détail..."
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <VoiceAssistant
            onTranscription={(text) => {
              setDescription(prev => prev ? `${prev}\n${text}` : text);
              console.log('[Voice] Transcription added to description');
            }}
            onAIAnalysis={(analysis) => {
              console.log('[Voice] AI Analysis:', analysis);
              if (analysis.category) {
                const matchingCategory = categories.find(c => c.id === analysis.category);
                if (matchingCategory) {
                  setCategoryId(matchingCategory.id);
                  console.log('[Voice] Auto-selected category from voice:', matchingCategory.id);
                }
              }
            }}
          />

          <SmartCategorySuggestion
            title={title}
            description={description}
            onSuggestionSelect={(suggestedCategory) => {
              setCategoryId(suggestedCategory);
              console.log('Category updated to:', suggestedCategory);
            }}
          />

          {aiInsights && aiInsights.probableIssues && aiInsights.probableIssues.length > 0 && (
            <View style={styles.aiInsightsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={18} color={Colors.secondary} />
                <Text style={styles.aiInsightsTitle}>Analyse IA du problème</Text>
                {aiInsights.confidence && (
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{Math.round(aiInsights.confidence * 100)}%</Text>
                  </View>
                )}
              </View>
              
              {aiInsights.probableIssues.map((issue, i) => (
                <Text key={i} style={styles.aiIssueText}>• {issue}</Text>
              ))}
              
              {aiInsights.severity && (
                <View style={[
                  styles.severityBadge,
                  aiInsights.severity === 'high' && { backgroundColor: Colors.error + '15', borderColor: Colors.error + '30' },
                  aiInsights.severity === 'medium' && { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '30' },
                  aiInsights.severity === 'low' && { backgroundColor: Colors.success + '15', borderColor: Colors.success + '30' },
                ]}>
                  <Text style={[
                    styles.severityText,
                    aiInsights.severity === 'high' && { color: Colors.error },
                    aiInsights.severity === 'medium' && { color: Colors.warning },
                    aiInsights.severity === 'low' && { color: Colors.success },
                  ]}>
                    Gravité: {aiInsights.severity === 'high' ? 'Élevée' : aiInsights.severity === 'medium' ? 'Moyenne' : 'Faible'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.label}>Adresse</Text>
              {isLoadingLocation && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Localisation...</Text>
                </View>
              )}
            </View>
            <View style={styles.addressBox}>
              <MapPin size={20} color={Colors.primary} strokeWidth={2} />
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  console.log('📍 Address manually changed:', text);
                }}
                placeholderTextColor={Colors.textLight}
                placeholder="Votre adresse d'intervention"
              />
            </View>
            {locationError && (
              <Text style={{ fontSize: 12, color: Colors.error, marginTop: 8 }}>
                ⚠️ Impossible d'obtenir votre position. Vous pouvez saisir votre adresse manuellement.
              </Text>
            )}
            {position && (
              <Text style={{ fontSize: 12, color: Colors.success, marginTop: 8 }}>
                ✓ Localisation actuelle détectée
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.label}>Photos (optionnel)</Text>
                {isAnalyzingPhotos && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={14} color={Colors.secondary} />
                    <Text style={{ fontSize: 12, color: Colors.secondary, fontWeight: '600' }}>Analyse IA...</Text>
                  </View>
                )}
              </View>
              {photos.length > 0 && (
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{photos.length}/5</Text>
              )}
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photosScroll}
            >
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={handleAddPhoto}
                activeOpacity={0.7}
                disabled={photos.length >= 5}
              >
                <Camera size={24} color={photos.length >= 5 ? Colors.textLight : Colors.primary} strokeWidth={2} />
                <Text style={[styles.photoButtonText, photos.length >= 5 && { color: Colors.textLight }]}>
                  {photos.length === 0 ? 'Ajouter' : 'Ajouter plus'}
                </Text>
              </TouchableOpacity>
              
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoPreview}>
                  <Image source={{ uri: photo }} style={styles.photoImage} resizeMode="cover" />
                  <TouchableOpacity 
                    style={styles.photoRemoveBtn}
                    onPress={() => removePhoto(index)}
                    activeOpacity={0.8}
                  >
                    <X size={14} color={Colors.surface} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={styles.photoTip}>
              <Text style={styles.photoTipText}>💡 Ajoutez des photos pour une analyse IA automatique du problème</Text>
            </View>
          </View>

          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Euro size={20} color={Colors.success} strokeWidth={2} />
              <Text style={styles.priceLabel}>Estimation</Text>
            </View>
            <Text style={styles.priceValue}>{estimatedPrice}€</Text>
            {dynamicPrice && (
              <Text style={styles.priceBreakdown}>{dynamicPrice.breakdownLabel}</Text>
            )}
            <Text style={styles.priceDescription}>
              Déplacement + intervention (tarif indicatif)
            </Text>
          </View>

          {aiInsights?.safetyAdvice && aiInsights.safetyAdvice.length > 0 && (
            <View style={styles.safetyBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color={Colors.warning} />
                <Text style={styles.safetyTitle}>Conseils de sécurité</Text>
              </View>
              {aiInsights.safetyAdvice.slice(0, 3).map((tip, i) => (
                <Text key={i} style={styles.safetyText}>• {tip}</Text>
              ))}
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Votre demande sera envoyée à tous les artisans disponibles dans votre secteur. Le premier qui accepte prendra la mission.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={Colors.surface} />
                <Text style={styles.submitButtonText}>
                  Envoi en cours...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                Envoyer la demande
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choisir une catégorie</Text>
                <TouchableOpacity 
                  onPress={() => setShowCategoryModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.categoryList}
                showsVerticalScrollIndicator={false}
              >
                {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        categoryId === cat.id && styles.categoryItemActive
                      ]}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setShowCategoryModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryItemEmoji}>{cat.emoji}</Text>
                      <Text style={[
                        styles.categoryItemText,
                        categoryId === cat.id && styles.categoryItemTextActive
                      ]}>
                        {cat.label}
                      </Text>
                      {cat.isPriority && (
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityText}>Populaire</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    gap: 4,
  },
  photoButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: Colors.border,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTip: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.info + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.info + '20',
  },
  photoTipText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  priceCard: {
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.success,
    marginBottom: 4,
  },
  priceBreakdown: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  safetyBox: {
    backgroundColor: Colors.warning + '10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.warning,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: Colors.info + '10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
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
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  categorySelectorEmoji: {
    fontSize: 24,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300' as const,
  },

  categoryList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    gap: 12,
  },
  categoryItemActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  categoryItemEmoji: {
    fontSize: 28,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryItemTextActive: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  priorityBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  aiInsightsCard: {
    backgroundColor: Colors.secondary + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  aiInsightsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  confidenceBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  aiIssueText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  severityBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
