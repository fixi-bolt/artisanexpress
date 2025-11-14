import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { ShoppingCart, ShieldCheck, Package } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const productsQuery = trpc.monetization.marketplace.getProducts.useQuery({ 
    category: selectedCategory,
    limit: 20 
  }, {
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });
  const purchaseMutation = trpc.monetization.marketplace.purchase.useMutation();
  const { user } = useAuth();

  const data = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  
  const categories = [
    { id: undefined, label: 'Tout' },
    { id: 'tools', label: 'Outils' },
    { id: 'materials', label: 'Matériaux' },
  ];

  const onBuy = async (productId: string) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour acheter.');
      return;
    }
    try {
      const res = await purchaseMutation.mutateAsync({ productId, quantity: 1, userId: user.id });
      if (res.success) Alert.alert('Commande créée', `N° ${res.orderId}`);
    } catch {
      Alert.alert('Erreur', 'Achat impossible, réessayez.');
    }
  };

  return (
    <View style={styles.container} testID="marketplace-screen">
      <Stack.Screen options={{ 
        title: 'Marketplace', 
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
      }} />
      
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Package size={24} color={Colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Marketplace Artisan</Text>
          <Text style={styles.headerSubtitle}>Outils et matériaux pour vos travaux</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id || 'all'}
            style={[
              styles.filterButton,
              selectedCategory === cat.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            testID={`filter-${cat.id || 'all'}`}
          >
            <Text style={[
              styles.filterText,
              selectedCategory === cat.id && styles.filterTextActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {productsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <Package size={48} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.loading}>Chargement des produits...</Text>
        </View>
      ) : productsQuery.isError ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.emptyText}>Erreur de connexion</Text>
          <Text style={styles.errorSubtext}>
            Impossible de charger les produits. Vérifiez votre connexion.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => productsQuery.refetch()}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.emptyText}>Aucun produit disponible</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                )}
                <Text style={styles.price}>{item.price.toFixed(2)} €</Text>
                <View style={styles.stockBadge}>
                  <ShieldCheck size={12} color={item.stock > 10 ? Colors.success : Colors.warning} />
                  <Text style={styles.stockText}>{item.stock} en stock</Text>
                </View>
                <TouchableOpacity 
                  style={styles.cta} 
                  onPress={() => onBuy(item.id)} 
                  testID={`buy-${item.id}`}
                  activeOpacity={0.8}
                >
                  <ShoppingCart color={Colors.surface} size={16} strokeWidth={2} />
                  <Text style={styles.ctaText}>Acheter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loading: { 
    fontSize: 16, 
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  list: { 
    padding: 12,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    overflow: 'hidden',
    margin: 6,
    maxWidth: '48%',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { 
    width: '100%', 
    height: 140,
    backgroundColor: Colors.borderLight,
  },
  info: { 
    padding: 12,
    gap: 6,
  },
  title: { 
    fontSize: 14, 
    fontWeight: '700' as const, 
    color: Colors.text,
    lineHeight: 18,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  price: { 
    fontSize: 18, 
    fontWeight: '700' as const, 
    color: Colors.primary,
    marginTop: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  stockText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  cta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6, 
    backgroundColor: Colors.primary, 
    paddingVertical: 10, 
    borderRadius: 10,
    marginTop: 8,
  },
  ctaText: { 
    color: Colors.surface, 
    fontWeight: '700' as const,
    fontSize: 13,
  },
});
