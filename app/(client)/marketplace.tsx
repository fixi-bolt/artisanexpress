import React, { useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { ShoppingCart, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketplaceScreen() {
  const productsQuery = trpc.monetization.marketplace.getProducts.useQuery({});
  const purchaseMutation = trpc.monetization.marketplace.purchase.useMutation();
  const { user } = useAuth();

  const data = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const onBuy = async (productId: string) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour acheter.');
      return;
    }
    try {
      const res = await purchaseMutation.mutateAsync({ productId, quantity: 1, userId: user.id });
      if (res.success) Alert.alert('Commande créée', `N° ${res.orderId}`);
    } catch (e) {
      Alert.alert('Erreur', 'Achat impossible, réessayez.');
    }
  };

  return (
    <View style={styles.container} testID="marketplace-screen">
      <Stack.Screen options={{ title: 'Marketplace', headerShown: true }} />
      {productsQuery.isLoading ? (
        <Text style={styles.loading}>Chargement...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.price}>{item.price.toFixed(2)} €</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cta} onPress={() => onBuy(item.id)} testID={`buy-${item.id}`}>
                    <ShoppingCart color={Colors.white} size={18} />
                    <Text style={styles.ctaText}>Acheter</Text>
                  </TouchableOpacity>
                  <View style={styles.badge}>
                    <ShieldCheck size={14} color={Colors.success} />
                    <Text style={styles.badgeText}>Stock {item.stock}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { padding: 16, color: Colors.textSecondary },
  list: { padding: 16, gap: 12 as const },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderColor: Colors.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 160 },
  info: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  price: { marginTop: 6, fontSize: 15, fontWeight: '600' as const, color: Colors.primary },
  actions: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8 as const, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  ctaText: { color: Colors.white, fontWeight: '700' as const },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 as const, backgroundColor: Colors.borderLight, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  badgeText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' as const },
});
