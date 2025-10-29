import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Plus, Trash2, Check, ArrowLeft, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { StripeCardField } from '@/components/StripeCardField';


interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [savedCards, setSavedCards] = useState<SavedCard[]>([
    {
      id: 'pm_test_1',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
  ]);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [addingCardStatus, setAddingCardStatus] = useState<'idle' | 'adding' | 'success' | 'error'>('idle');

  const handleAddCard = async () => {
    if (!cardComplete) {
      Alert.alert('Erreur', 'Veuillez remplir correctement les informations de la carte');
      return;
    }

    try {
      setAddingCardStatus('adding');

      const newCard: SavedCard = {
        id: `pm_test_${Date.now()}`,
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: savedCards.length === 0,
      };

      setSavedCards([...savedCards, newCard]);
      setAddingCardStatus('success');
      
      setTimeout(() => {
        setIsAddingCard(false);
        setAddingCardStatus('idle');
        setCardComplete(false);
      }, 1000);

      Alert.alert('Succès', 'Carte ajoutée avec succès');
    } catch (error: any) {
      setAddingCardStatus('error');
      Alert.alert('Erreur', error.message || 'Impossible d&apos;ajouter la carte');
      setTimeout(() => setAddingCardStatus('idle'), 2000);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const card = savedCards.find(c => c.id === cardId);
    if (card?.isDefault && savedCards.length > 1) {
      Alert.alert(
        'Attention',
        'Cette carte est définie par défaut. Veuillez définir une autre carte par défaut avant de la supprimer.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Supprimer la carte',
      'Êtes-vous sûr de vouloir supprimer cette carte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setSavedCards(savedCards.filter(c => c.id !== cardId));
            Alert.alert('Succès', 'Carte supprimée');
          },
        },
      ]
    );
  };

  const handleSetDefaultCard = (cardId: string) => {
    setSavedCards(
      savedCards.map(card => ({
        ...card,
        isDefault: card.id === cardId,
      }))
    );
    Alert.alert('Succès', 'Carte définie par défaut');
  };

  const getBrandIcon = (brand: string) => {
    return <CreditCard size={24} color={Colors.primary} strokeWidth={2} />;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Moyens de paiement',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: Colors.background },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.testModeCard}>
          <AlertCircle size={20} color={Colors.warning} strokeWidth={2} />
          <View style={styles.testModeContent}>
            <Text style={styles.testModeTitle}>Mode Test Stripe</Text>
            <Text style={styles.testModeText}>
              Utilisez les cartes de test pour tester les paiements
            </Text>
          </View>
        </View>

        <View style={styles.testCardsInfo}>
          <Text style={styles.testCardsTitle}>💳 Cartes test Stripe:</Text>
          <Text style={styles.testCardItem}>• 4242 4242 4242 4242 (Succès)</Text>
          <Text style={styles.testCardItem}>• 4000 0000 0000 0002 (Déclinée)</Text>
          <Text style={styles.testCardItem}>• 4000 0000 0000 9995 (Fonds insuffisants)</Text>
          <Text style={styles.testCardItem}>Date: n&apos;importe quelle date future</Text>
          <Text style={styles.testCardItem}>CVV: n&apos;importe quel 3 chiffres</Text>
        </View>

        <Text style={styles.sectionTitle}>Cartes enregistrées</Text>

        {savedCards.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={48} color={Colors.textLight} strokeWidth={1.5} />
            <Text style={styles.emptyStateText}>Aucune carte enregistrée</Text>
            <Text style={styles.emptyStateSubtext}>
              Ajoutez une carte pour effectuer des paiements rapidement
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {savedCards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardItemContent}>
                  <View style={styles.cardItemLeft}>
                    {getBrandIcon(card.brand)}
                    <View style={styles.cardItemInfo}>
                      <Text style={styles.cardBrand}>{card.brand}</Text>
                      <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                      <Text style={styles.cardExpiry}>
                        Expire {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardItemActions}>
                    {card.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Check size={14} color={Colors.white} strokeWidth={3} />
                        <Text style={styles.defaultBadgeText}>Par défaut</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.cardActions}>
                  {!card.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefaultCard(card.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>Définir par défaut</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleDeleteCard(card.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                    <Text style={styles.actionButtonTextDanger}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {isAddingCard ? (
          <View style={styles.addCardForm}>
            <Text style={styles.addCardTitle}>Ajouter une nouvelle carte</Text>

            <View style={styles.cardFieldContainer}>
              <StripeCardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={cardFieldStyles}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardComplete(cardDetails.complete);
                }}
              />
            </View>

            <View style={styles.addCardActions}>
              <TouchableOpacity
                style={[styles.addCardButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddingCard(false);
                  setCardComplete(false);
                  setAddingCardStatus('idle');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addCardButton,
                  styles.confirmButton,
                  (!cardComplete || addingCardStatus === 'adding') && styles.confirmButtonDisabled,
                ]}
                onPress={handleAddCard}
                disabled={!cardComplete || addingCardStatus === 'adding'}
                activeOpacity={0.7}
              >
                {addingCardStatus === 'adding' ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingCard(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Ajouter une carte</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const cardFieldStyles = {
  backgroundColor: Colors.white,
  textColor: Colors.text,
  borderWidth: 0,
  borderRadius: 12,
  fontSize: 16,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  testModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  testModeContent: {
    flex: 1,
  },
  testModeTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  testModeText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  testCardsInfo: {
    backgroundColor: Colors.primaryLight + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  testCardsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  testCardItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardItemInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.textLight,
  },
  cardItemActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary + '10',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionButtonDanger: {
    backgroundColor: Colors.error + '10',
  },
  actionButtonTextDanger: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  addCardForm: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  cardFieldContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardField: {
    height: 50,
  },
  addCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addCardButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
