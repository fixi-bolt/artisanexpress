import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, Lightbulb, Euro, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { generateObject } from '@/lib/rork-toolkit-sdk';
import { z } from 'zod';
import { useMissions } from '@/contexts/MissionContext';
import { ArtisanCategory } from '@/types';
import { categories } from '@/mocks/artisans';

type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  estimation?: {
    category: ArtisanCategory;
    categoryLabel: string;
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    urgency: 'low' | 'medium' | 'high';
    title: string;
    description: string;
  };
};

export default function AIAssistantScreen() {
  const router = useRouter();
  const { createMission } = useMissions();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Bonjour ! Je suis votre assistant intelligent. Décrivez-moi votre problème et je vous aiderai à trouver le bon artisan avec une estimation de prix.",
      suggestions: [
        "J'ai une fuite d'eau sous l'évier",
        "Mes prises électriques ne fonctionnent plus",
        "Ma serrure est cassée",
      ],
    },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);



  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAnalyzing(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `You are an AI assistant for ArtisanNow, a platform connecting clients with artisans.

Analyze this problem and provide:
1. The correct artisan category (plumber, electrician, carpenter, locksmith, painter, mechanic, hvac, gardener)
2. A clear title for the mission (max 60 characters)
3. A detailed description
4. A realistic price estimate in euros (consider: diagnosis 40-60€, hourly rate 40-80€/h, materials, travel 20-40€)
5. A price range (min-max)
6. Urgency level (low, medium, high)
7. A friendly explanation in French

User's problem: "${userMessage.content}"

Provide realistic French market prices.`
          }
        ],
        schema: z.object({
          category: z.enum(['plumber', 'electrician', 'carpenter', 'locksmith', 'painter', 'mechanic', 'hvac', 'gardener']),
          title: z.string(),
          description: z.string(),
          estimatedPrice: z.number(),
          priceMin: z.number(),
          priceMax: z.number(),
          urgency: z.enum(['low', 'medium', 'high']),
          explanation: z.string(),
        }),
      });

      const categoryData = categories.find(c => c.id === result.category);
      
      const estimation = {
        category: result.category,
        categoryLabel: categoryData?.label || result.category,
        estimatedPrice: result.estimatedPrice,
        priceRange: { min: result.priceMin, max: result.priceMax },
        urgency: result.urgency,
        title: result.title,
        description: result.description,
      };

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.explanation,
        estimation,
      }]);
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error('AI error:', error);
      setIsAnalyzing(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      }]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleCreateMission = async (estimation: AIMessage['estimation']) => {
    if (!estimation) return;

    const mission = await createMission({
      category: estimation.category,
      title: estimation.title,
      description: estimation.description,
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        address: '15 Rue de Rivoli, 75001 Paris',
      },
      estimatedPrice: estimation.estimatedPrice,
    });

    console.log('Mission created from AI:', mission.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color={Colors.secondary} strokeWidth={2} fill={Colors.secondary} />
              <Text style={styles.headerTitle}>Assistant IA</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Décrivez votre problème
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}>
                {message.role === 'assistant' && (
                  <View style={styles.aiIcon}>
                    <Sparkles size={14} color={Colors.secondary} strokeWidth={2} />
                  </View>
                )}
                <Text style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.assistantText,
                ]}>
                  {message.content}
                </Text>
              </View>

              {message.suggestions && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionHeader}>
                    <Lightbulb size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.suggestionHeaderText}>Suggestions</Text>
                  </View>
                  {message.suggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionButton}
                      onPress={() => handleSuggestionClick(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {message.estimation && (
                <View style={styles.estimationCard}>
                  <View style={styles.estimationHeader}>
                    <CheckCircle size={20} color={Colors.success} strokeWidth={2} />
                    <Text style={styles.estimationTitle}>Estimation prête</Text>
                  </View>

                  <View style={styles.estimationContent}>
                    <View style={styles.estimationRow}>
                      <Text style={styles.estimationLabel}>Catégorie</Text>
                      <Text style={styles.estimationValue}>{message.estimation.categoryLabel}</Text>
                    </View>

                    <View style={styles.estimationRow}>
                      <Text style={styles.estimationLabel}>Mission</Text>
                      <Text style={styles.estimationValue}>{message.estimation.title}</Text>
                    </View>

                    <View style={styles.priceBox}>
                      <Euro size={24} color={Colors.success} strokeWidth={2} />
                      <View style={styles.priceContent}>
                        <Text style={styles.priceValue}>{message.estimation.estimatedPrice}€</Text>
                        <Text style={styles.priceRange}>
                          ({message.estimation.priceRange.min}€ - {message.estimation.priceRange.max}€)
                        </Text>
                      </View>
                    </View>

                    <View style={[
                      styles.urgencyBadge,
                      message.estimation.urgency === 'high' && styles.urgencyHigh,
                      message.estimation.urgency === 'medium' && styles.urgencyMedium,
                      message.estimation.urgency === 'low' && styles.urgencyLow,
                    ]}>
                      <Text style={styles.urgencyText}>
                        {message.estimation.urgency === 'high' ? '🔥 Urgent' : 
                         message.estimation.urgency === 'medium' ? '⚡ Modéré' : 
                         '✓ Non urgent'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => handleCreateMission(message.estimation)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createButtonText}>Créer la demande</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {isAnalyzing && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator size="small" color={Colors.secondary} />
              <Text style={[styles.messageText, styles.assistantText, { marginLeft: 8 }]}>
                Analyse en cours...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Décrivez votre problème..."
            placeholderTextColor={Colors.textLight}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!isAnalyzing}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isAnalyzing) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isAnalyzing}
            activeOpacity={0.7}
          >
            <Send size={20} color={Colors.surface} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  userText: {
    color: Colors.surface,
  },
  assistantText: {
    color: Colors.text,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  suggestionsContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  suggestionHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  suggestionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
  },
  estimationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.success + '40',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  estimationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  estimationTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  estimationContent: {
    gap: 12,
  },
  estimationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  estimationValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  priceContent: {
    flex: 1,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.success,
  },
  priceRange: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyHigh: {
    backgroundColor: Colors.error + '20',
  },
  urgencyMedium: {
    backgroundColor: Colors.warning + '20',
  },
  urgencyLow: {
    backgroundColor: Colors.success + '20',
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  createButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
