import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || user.type !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard Admin',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          title: 'Gestion Utilisateurs',
        }} 
      />
      <Stack.Screen 
        name="missions" 
        options={{ 
          title: 'Gestion Missions',
        }} 
      />
      <Stack.Screen 
        name="transactions" 
        options={{ 
          title: 'Transactions',
        }} 
      />
    </Stack>
  );
}
