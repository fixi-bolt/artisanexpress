import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Camera, MapPin, Euro, Shield, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { categories } from '@/mocks/artisans';
import { useMissions } from '@/contexts/MissionContext';
import { ArtisanCategory } from '@/types';
import SmartCategorySuggestion from '@/components/SmartCategorySuggestion';
import AIProblemAnalyzer from '@/components/AIProblemAnalyzer';

export default function RequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createMission } = useMissions();
  
  const [categoryId, setCategoryId] = useState<ArtisanCategory>((params.category as ArtisanCategory) || 'plumber');
  const category = categories.find(c => c.id === categoryId);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<{ severity?: 'low'|'medium'|'high'; safetyAdvice?: string[] } | null>(null);
  const [dynamicPrice, setDynamicPrice] = useState<{ total: number; breakdownLabel: string } | null>(null);
  const [address, setAddress] = useState('15 Rue de Rivoli, 75001 Paris');

  const [estimatedPrice, setEstimatedPrice] = useState<number>(80 + Math.floor(Math.random() * 70));
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    const mission = createMission({
      category: categoryId,
      title: title.trim(),
      description: description.trim(),
      photos,
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        address,
      },
      estimatedPrice,
    });

    console.log('Mission created:', mission.id);
    Alert.alert(
      'Demande envoyée !',
      'Nous recherchons un artisan disponible. Vous serez notifié dès qu\'un artisan accepte.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleAddPhoto = () => {
    const mockPhoto = `https://images.unsplash.com/photo-${Date.now()}?w=400`;
    setPhotos([...photos, mockPhoto]);
    console.log('Photo added');
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

          <SmartCategorySuggestion
            title={title}
            description={description}
            onSuggestionSelect={(suggestedCategory) => {
              setCategoryId(suggestedCategory);
              console.log('Category updated to:', suggestedCategory);
            }}
          />

          <AIProblemAnalyzer
            description={description}
            onInsights={(insights) => {
              setAiInsights({ severity: insights.severity, safetyAdvice: insights.safetyAdvice });
            }}
            onDynamicPrice={(p) => {
              setDynamicPrice(p);
              setEstimatedPrice(Math.round(p.total));
            }}
          />

          <View style={styles.section}>
            <Text style={styles.label}>Adresse</Text>
            <View style={styles.addressBox}>
              <MapPin size={20} color={Colors.primary} strokeWidth={2} />
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Photos (optionnel)</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photosScroll}
            >
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={handleAddPhoto}
                activeOpacity={0.7}
              >
                <Camera size={24} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.photoButtonText}>Ajouter</Text>
              </TouchableOpacity>
              
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoPreview}>
                  <Text style={styles.photoEmoji}>📸</Text>
                  <Text style={styles.photoIndex}>{index + 1}</Text>
                </View>
              ))}
            </ScrollView>
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
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              Envoyer la demande
            </Text>
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
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  photoEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoIndex: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
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

});
