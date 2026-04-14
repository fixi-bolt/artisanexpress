import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Shield,
  Users,
  Wifi,
} from 'lucide-react-native';

interface DiagResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

const TABLES_TO_CHECK = [
  'users',
  'artisans',
  'clients',
  'admins',
  'missions',
  'notifications',
  'transactions',
  'payments',
  'reviews',
  'chat_messages',
  'wallets',
  'wallet_transactions',
  'subscriptions',
  'campaigns',
  'disputes',
  'referrals',
  'push_tokens',
  'notification_preferences',
  'analytics_daily',
  'email_queue',
  'artisan_profiles',
];

export default function DiagnosticScreen() {
  const [results, setResults] = useState<DiagResult[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<{ ok: number; warn: number; fail: number } | null>(null);

  const addResult = useCallback((result: DiagResult) => {
    setResults((prev) => [...prev, result]);
  }, []);

  const runDiagnostic = useCallback(async () => {
    setResults([]);
    setSummary(null);
    setRunning(true);
    const allResults: DiagResult[] = [];

    const push = (r: DiagResult) => {
      allResults.push(r);
      setResults([...allResults]);
    };

    // 1. Check env vars
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!url) {
      push({ name: 'EXPO_PUBLIC_SUPABASE_URL', status: 'error', message: 'Variable manquante' });
    } else {
      push({ name: 'EXPO_PUBLIC_SUPABASE_URL', status: 'success', message: url.substring(0, 40) + '...' });
    }

    if (!key) {
      push({ name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', status: 'error', message: 'Variable manquante' });
    } else {
      push({ name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', status: 'success', message: key.substring(0, 20) + '...' });
    }

    // 2. Connectivity test
    try {
      const start = Date.now();
      const res = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      const latency = Date.now() - start;
      if (res.ok) {
        push({ name: 'Connexion REST API', status: 'success', message: `OK (${latency}ms)` });
      } else {
        push({ name: 'Connexion REST API', status: 'error', message: `HTTP ${res.status}`, details: await res.text() });
      }
    } catch (e: any) {
      push({ name: 'Connexion REST API', status: 'error', message: e.message });
    }

    // 3. Auth service
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        push({ name: 'Auth Service', status: 'warning', message: error.message });
      } else if (data.session) {
        push({
          name: 'Auth Service',
          status: 'success',
          message: `Session active: ${data.session.user.email || data.session.user.id.substring(0, 8)}`,
        });
      } else {
        push({ name: 'Auth Service', status: 'warning', message: 'Pas de session active (non connecte)' });
      }
    } catch (e: any) {
      push({ name: 'Auth Service', status: 'error', message: e.message });
    }

    // 4. Check each table
    for (const table of TABLES_TO_CHECK) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42501' || error.message.includes('permission')) {
            push({ name: `Table: ${table}`, status: 'warning', message: `RLS bloque (${error.code})`, details: error.message });
          } else if (error.code === '42P01') {
            push({ name: `Table: ${table}`, status: 'error', message: "Table n'existe pas", details: error.message });
          } else {
            push({ name: `Table: ${table}`, status: 'error', message: `Erreur: ${error.code}`, details: error.message });
          }
        } else {
          push({ name: `Table: ${table}`, status: 'success', message: `${count ?? 0} lignes` });
        }
      } catch (e: any) {
        push({ name: `Table: ${table}`, status: 'error', message: e.message });
      }
    }

    // 5. RLS check - try an insert/delete on users to see if RLS is active
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        push({ name: 'RLS - Lecture users', status: 'warning', message: `Bloque: ${error.message}` });
      } else {
        push({ name: 'RLS - Lecture users', status: 'success', message: 'Lecture autorisee' });
      }
    } catch (e: any) {
      push({ name: 'RLS - Lecture users', status: 'error', message: e.message });
    }

    // 6. Realtime check
    try {
      const channel = supabase.channel('diag-test');
      let realtimeOk = false;

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (!realtimeOk) {
            push({ name: 'Realtime', status: 'warning', message: 'Timeout (3s) - peut etre normal sur web' });
          }
          channel.unsubscribe();
          resolve();
        }, 3000);

        channel.subscribe((status) => {
          console.log('Realtime status:', status);
          if (status === 'SUBSCRIBED') {
            realtimeOk = true;
            push({ name: 'Realtime', status: 'success', message: 'Connecte' });
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            push({ name: 'Realtime', status: 'error', message: 'Erreur de connexion' });
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve();
          }
        });
      });
    } catch (e: any) {
      push({ name: 'Realtime', status: 'error', message: e.message });
    }

    // 7. Storage check
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        push({ name: 'Storage', status: 'warning', message: error.message });
      } else {
        const bucketNames = data?.map((b) => b.name).join(', ') || 'aucun';
        push({ name: 'Storage', status: 'success', message: `Buckets: ${bucketNames}` });
      }
    } catch (e: any) {
      push({ name: 'Storage', status: 'error', message: e.message });
    }

    // Summary
    const ok = allResults.filter((r) => r.status === 'success').length;
    const warn = allResults.filter((r) => r.status === 'warning').length;
    const fail = allResults.filter((r) => r.status === 'error').length;
    setSummary({ ok, warn, fail });
    setRunning(false);
  }, []);

  const getIcon = (status: DiagResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={18} color="#22c55e" />;
      case 'error':
        return <XCircle size={18} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      default:
        return <ActivityIndicator size="small" color="#6b7280" />;
    }
  };

  const getStatusColor = (status: DiagResult['status']) => {
    switch (status) {
      case 'success': return '#dcfce7';
      case 'error': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return '#f3f4f6';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Diagnostic Supabase', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Database size={32} color="#3b82f6" />
            <Text style={styles.title}>Diagnostic Supabase</Text>
            <Text style={styles.subtitle}>Verifie la connexion, les tables, l'auth, le realtime et le storage</Text>
          </View>

          <TouchableOpacity
            style={[styles.runButton, running && styles.runButtonDisabled]}
            onPress={runDiagnostic}
            disabled={running}
            activeOpacity={0.7}
          >
            {running ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <RefreshCw size={20} color="#fff" />
            )}
            <Text style={styles.runButtonText}>
              {running ? 'Analyse en cours...' : 'Lancer le diagnostic'}
            </Text>
          </TouchableOpacity>

          {summary && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryBadge, { backgroundColor: '#dcfce7' }]}>
                  <CheckCircle size={16} color="#22c55e" />
                  <Text style={[styles.summaryNum, { color: '#16a34a' }]}>{summary.ok}</Text>
                </View>
                <View style={[styles.summaryBadge, { backgroundColor: '#fef3c7' }]}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <Text style={[styles.summaryNum, { color: '#d97706' }]}>{summary.warn}</Text>
                </View>
                <View style={[styles.summaryBadge, { backgroundColor: '#fee2e2' }]}>
                  <XCircle size={16} color="#ef4444" />
                  <Text style={[styles.summaryNum, { color: '#dc2626' }]}>{summary.fail}</Text>
                </View>
              </View>
              <Text style={styles.summaryText}>
                {summary.fail === 0 && summary.warn === 0
                  ? 'Tout est OK !'
                  : summary.fail > 0
                  ? `${summary.fail} erreur(s) detectee(s)`
                  : `${summary.warn} avertissement(s)`}
              </Text>
            </View>
          )}

          {results.map((r, i) => (
            <View key={i} style={[styles.resultCard, { backgroundColor: getStatusColor(r.status) }]}>
              <View style={styles.resultHeader}>
                {getIcon(r.status)}
                <Text style={styles.resultName}>{r.name}</Text>
              </View>
              <Text style={styles.resultMessage}>{r.message}</Text>
              {r.details && <Text style={styles.resultDetails}>{r.details}</Text>}
            </View>
          ))}

          {results.length === 0 && !running && (
            <View style={styles.emptyState}>
              <Wifi size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>Appuyez sur le bouton pour lancer le diagnostic</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#f8fafc',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center' as const,
  },
  runButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center' as const,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  summaryBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  summaryText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  resultCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    flex: 1,
  },
  resultMessage: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 26,
  },
  resultDetails: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 26,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center' as const,
  },
});
