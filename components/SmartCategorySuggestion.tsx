import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { generateText } from '@rork/toolkit-sdk';
import { ArtisanCategory } from '@/types';
import { categories } from '@/mocks/artisans';

interface SmartCategorySuggestionProps {
  title: string;
  description: string;
  onSuggestionSelect: (category: ArtisanCategory, confidence: number) => void;
}

export default function SmartCategorySuggestion({ 
  title, 
  description, 
  onSuggestionSelect 
}: SmartCategorySuggestionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    category: ArtisanCategory;
    confidence: number;
    reason: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeProblem = async () => {
    if (!title.trim() && !description.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = `You are an AI assistant for ArtisanNow. Based on this problem description, determine which artisan category is needed.

Title: ${title}
Description: ${description}

Available categories:
- plumber: Plumbing, water leaks, pipes, faucets, toilets
- electrician: Electrical work, wiring, outlets, lighting
- carpenter: Woodwork, furniture, doors, cabinets
- locksmith: Locks, keys, security systems
- painter: Painting, walls, decoration
- mechanic: Mechanical repairs, engines, machinery
- hvac: Heating, ventilation, air conditioning
- gardener: Gardening, landscaping, outdoor work

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{"category": "category_id", "confidence": 0.95, "reason": "Brief explanation in French"}

Confidence: 0-1 (1 = very confident)`;

      const response = await generateText(prompt);
      console.log('AI Category Response:', response);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.category || !parsed.confidence || !parsed.reason) {
        throw new Error('Missing required fields');
      }

      const validCategories: ArtisanCategory[] = [
        'plumber', 'electrician', 'carpenter', 'locksmith', 
        'painter', 'mechanic', 'hvac', 'gardener'
      ];

      if (!validCategories.includes(parsed.category)) {
        throw new Error('Invalid category');
      }

      setSuggestion({
        category: parsed.category,
        confidence: parsed.confidence,
        reason: parsed.reason,
      });

    } catch (err) {
      console.error('AI Analysis Error:', err);
      setError('Impossible d&apos;analyser pour le moment');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onSuggestionSelect(suggestion.category, suggestion.confidence);
    }
  };

  if (!title.trim() && !description.trim()) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!suggestion && !isAnalyzing && !error && (
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={analyzeProblem}
          activeOpacity={0.7}
        >
          <Sparkles size={18} color={Colors.secondary} strokeWidth={2} />
          <Text style={styles.analyzeButtonText}>
            Suggérer une catégorie avec l&apos;IA
          </Text>
        </TouchableOpacity>
      )}

      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.secondary} />
          <Text style={styles.loadingText}>Analyse en cours...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={18} color={Colors.error} strokeWidth={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {suggestion && (
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Sparkles size={18} color={Colors.secondary} strokeWidth={2} fill={Colors.secondary} />
            <Text style={styles.suggestionTitle}>Suggestion IA</Text>
            <View style={[
              styles.confidenceBadge,
              suggestion.confidence >= 0.8 ? styles.confidenceHigh :
              suggestion.confidence >= 0.6 ? styles.confidenceMedium :
              styles.confidenceLow
            ]}>
              <Text style={styles.confidenceText}>
                {Math.round(suggestion.confidence * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.suggestionContent}>
            <Text style={styles.categoryName}>
              {categories.find(c => c.id === suggestion.category)?.label || suggestion.category}
            </Text>
            <Text style={styles.reason}>{suggestion.reason}</Text>
          </View>

          <View style={styles.suggestionActions}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => setSuggestion(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>Ignorer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Utiliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary + '15',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    flex: 1,
  },
  suggestionCard: {
    backgroundColor: Colors.secondary + '10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.secondary + '30',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceHigh: {
    backgroundColor: Colors.success + '30',
  },
  confidenceMedium: {
    backgroundColor: Colors.warning + '30',
  },
  confidenceLow: {
    backgroundColor: Colors.error + '30',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  suggestionContent: {
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 6,
  },
  reason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
