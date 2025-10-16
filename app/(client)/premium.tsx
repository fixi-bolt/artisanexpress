import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useMonetization } from '@/contexts/MonetizationContext';
import { Crown } from 'lucide-react-native';

export default function PremiumScreen() {
  const { subscription, subscribeClient, subscribing } = useMonetization();

  const onSubscribe = async (plan: 'premium_monthly' | 'premium_annual') => {
    try {
      const res = await subscribeClient(plan, 'pm_mock');
      if (res.success) Alert.alert('Merci', 'Votre abonnement est actif.');
    } catch (e) {
      Alert.alert('Erreur', 'Abonnement impossible, réessayez.');
    }
  };

  return (
    <View style={styles.container} testID="premium-screen">
      <Stack.Screen options={{ title: 'Client Premium', headerShown: true }} />
      <View style={styles.hero}>
        <Crown color={Colors.secondary} size={28} />
        <Text style={styles.title}>Interventions prioritaires</Text>
        <Text style={styles.subtitle}>Frais réduits, support VIP, et plus.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.planTitle}>Mensuel</Text>
        <Text style={styles.planPrice}>6,99 € / mois</Text>
        <TouchableOpacity style={styles.cta} disabled={subscribing} onPress={() => onSubscribe('premium_monthly')} testID="subscribe-monthly">
          <Text style={styles.ctaText}>{subscribing ? 'Chargement...' : 'Choisir'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.planTitle}>Annuel</Text>
        <Text style={styles.planPrice}>69,99 € / an</Text>
        <TouchableOpacity style={[styles.cta, { backgroundColor: Colors.secondary }]} disabled={subscribing} onPress={() => onSubscribe('premium_annual')} testID="subscribe-annual">
          <Text style={styles.ctaText}>{subscribing ? 'Chargement...' : 'Choisir'}</Text>
        </TouchableOpacity>
      </View>

      {subscription?.status === 'active' && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Abonnement actif</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  hero: { gap: 8 as const, alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, borderColor: Colors.border, borderWidth: 1, marginVertical: 8 },
  planTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  planPrice: { marginTop: 6, fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
  cta: { marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: Colors.white, fontWeight: '800' as const },
  activeBadge: { marginTop: 16, alignSelf: 'center', backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  activeText: { color: Colors.white, fontWeight: '700' as const },
});
