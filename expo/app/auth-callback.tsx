import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const [errorText, setErrorText] = useState<string>('');

  useEffect(() => {
    const handle = async () => {
      try {
        const url = await Linking.getInitialURL();
        const latest = url || (await new Promise<string | null>((resolve) => {
          const sub = Linking.addEventListener('url', (e) => {
            sub.remove();
            resolve(e.url);
          });
          setTimeout(() => resolve(null), 300);
        }));

        const raw = latest ?? '';
        const parsed = Linking.parse(raw);
        const query = (parsed.queryParams ?? {}) as Record<string, string>;

        const hash = raw.includes('#') ? raw.split('#')[1] : '';
        const hashParams = Object.fromEntries(new URLSearchParams(hash) as any) as Record<string, string>;

        const code = (query['code'] as string | undefined) ?? (hashParams['code'] as string | undefined);
        const accessToken = (hashParams['access_token'] as string | undefined) ?? (query['access_token'] as string | undefined);
        const refreshToken = (hashParams['refresh_token'] as string | undefined) ?? (query['refresh_token'] as string | undefined);

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else {
          throw new Error('Lien invalide ou expiré');
        }

        setStatus('ok');
        router.replace('/');
      } catch (err: any) {
        setStatus('error');
        setErrorText(err?.message ?? 'Erreur inconnue');
      }
    };

    handle();
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container} testID="auth-callback">
        {status === 'pending' && (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.text}>Connexion en cours...</Text>
          </>
        )}
        {status === 'error' && (
          <>
            <Text style={styles.title}>Échec de vérification</Text>
            <Text style={styles.text}>{errorText}</Text>
          </>
        )}
        {status === 'ok' && <Text style={styles.text}>Connecté</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 24 },
  title: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  text: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
});
