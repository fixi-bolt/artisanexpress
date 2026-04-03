import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Users, Sparkles, ShoppingBag, Receipt } from 'lucide-react-native';

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      id: 'artisans',
      title: 'Artisans',
      description: 'Trouvez et contactez des artisans qualifiés',
      icon: Users,
      color: '#3B82F6',
      route: '/(client)/artisans',
    },
    {
      id: 'super-app',
      title: 'Super App',
      description: 'Tous les services en un seul endroit',
      icon: Sparkles,
      color: '#8B5CF6',
      route: '/(client)/super-hub',
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Outils et matériaux pour vos travaux',
      icon: ShoppingBag,
      color: '#10B981',
      route: '/(client)/marketplace',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'Historique de vos paiements',
      icon: Receipt,
      color: '#F59E0B',
      route: '/(client)/transactions',
    },
  ];

  const handleNavigation = (route: string) => {
    console.log('📍 Navigating to:', route);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Menu',
          headerShown: false,
        }} 
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Menu</Text>
        <Text style={styles.headerSubtitle}>Accédez à tous les services</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuCard,
                index === 0 && styles.firstCard,
              ]}
              activeOpacity={0.7}
              onPress={() => handleNavigation(item.route)}
              testID={`menu-${item.id}`}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Icon size={28} color={item.color} strokeWidth={2} />
              </View>
              
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              
              <View style={[styles.arrow, { backgroundColor: item.color + '10' }]}>
                <Text style={[styles.arrowText, { color: item.color }]}>→</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Besoin d&apos;aide ?</Text>
          <Text style={styles.infoText}>
            Chaque rubrique vous permet d&apos;accéder rapidement aux services dont vous avez besoin.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  firstCard: {
    marginTop: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  infoCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
