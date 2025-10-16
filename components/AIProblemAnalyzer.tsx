import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import Colors from '@/constants/colors';
import { Image as ImageIcon, ShieldAlert, Sparkles, Euro } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface AIProblemAnalyzerProps {
  description: string;
  onInsights: (insights: {
    detectedCategory?: string;
    severity?: 'low' | 'medium' | 'high';
    confidence?: number;
    probableIssues?: string[];
    recommendedParts?: string[];
    safetyAdvice?: string[];
  }) => void;
  onDynamicPrice: (price: { total: number; breakdownLabel: string }) => void;
}

export default function AIProblemAnalyzer({ description, onInsights, onDynamicPrice }: AIProblemAnalyzerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const vision = trpc.ai.visionAnalyze.useMutation();
  const pricing = trpc.ai.dynamicPricing.useMutation();

  const analyze = async () => {
    if (!imageUrl.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await vision.mutateAsync({
        description,
        imageUrls: [imageUrl.trim()],
      });

      const a = res.analysis;
      onInsights({
        detectedCategory: a.detectedCategory,
        severity: a.severity as 'low' | 'medium' | 'high',
        confidence: a.confidence,
        probableIssues: a.probableIssues,
        recommendedParts: a.recommendedParts,
        safetyAdvice: a.safetyAdvice,
      });

      const base = 70;
      const demandIndex = a.severity === 'high' ? 0.9 : a.severity === 'medium' ? 0.6 : 0.3;
      const dp = await pricing.mutateAsync({
        basePrice: base,
        category: a.detectedCategory ?? 'general',
        demandIndex,
        urgency: a.severity ?? 'medium',
      });

      onDynamicPrice({ total: dp.total, breakdownLabel: `x${dp.breakdown.surge} • dist ${dp.breakdown.distanceFee} • ${dp.currency}` });
      await utils.invalidate();
    } catch (e) {
      console.error('AI analyze error', e);
      setError("Analyse impossible pour le moment");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container} testID="aiProblemAnalyzer">
      <Text style={styles.label}>Analyse IA depuis une photo (URL)</Text>
      <View style={styles.row}>
        <ImageIcon size={18} color={Colors.primary} />
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={Colors.textLight}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.analyzeBtn} onPress={analyze} activeOpacity={0.8} testID="analyzeBtn">
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Sparkles size={16} color={Colors.surface} />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <ShieldAlert size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.tip}>
        <Euro size={14} color={Colors.success} />
        <Text style={styles.tipText}>Astuce: colle un lien d&apos;image Unsplash d&apos;un problème similaire pour une estimation rapide.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 14,
  },
  analyzeBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
});
