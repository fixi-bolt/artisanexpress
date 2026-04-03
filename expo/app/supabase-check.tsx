import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  RefreshCw,
  Shield,
  Wifi,
  HardDrive,
  Radio,
  Key,
  Loader,
} from 'lucide-react-native';
import {
  runFullVerification,
  type CheckResult,
  type CheckStatus,
} from '@/utils/supabaseVerification';

const STATUS_COLORS: Record<CheckStatus, string> = {
  pending: '#8E8E93',
  running: '#007AFF',
  success: '#30D158',
  error: '#FF453A',
  warning: '#FF9F0A',
};

const STATUS_BG: Record<CheckStatus, string> = {
  pending: '#F2F2F7',
  running: '#E8F0FE',
  success: '#E8F8EE',
  error: '#FFECE9',
  warning: '#FFF4E0',
};

function getIconForCheck(id: string) {
  if (id === 'connection') return Wifi;
  if (id === 'auth') return Shield;
  if (id === 'env') return Key;
  if (id === 'storage') return HardDrive;
  if (id === 'realtime') return Radio;
  return Database;
}

function StatusIcon({ status, size = 18 }: { status: CheckStatus; size?: number }) {
  if (status === 'success') return <CheckCircle size={size} color={STATUS_COLORS.success} />;
  if (status === 'error') return <XCircle size={size} color={STATUS_COLORS.error} />;
  if (status === 'warning') return <AlertTriangle size={size} color={STATUS_COLORS.warning} />;
  if (status === 'running') return <Loader size={size} color={STATUS_COLORS.running} />;
  return <View style={[styles.pendingDot, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3 }]} />;
}

function CheckRow({ check }: { check: CheckResult }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const Icon = getIconForCheck(check.id);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.checkRow, { backgroundColor: STATUS_BG[check.status], opacity: fadeAnim }]}>
      <View style={styles.checkIconWrap}>
        <Icon size={20} color={STATUS_COLORS[check.status]} />
      </View>
      <View style={styles.checkContent}>
        <View style={styles.checkHeader}>
          <Text style={styles.checkLabel}>{check.label}</Text>
          <StatusIcon status={check.status} size={16} />
        </View>
        {check.message ? (
          <Text style={[styles.checkMessage, { color: STATUS_COLORS[check.status] }]} numberOfLines={2}>
            {check.message}
          </Text>
        ) : null}
        {check.details ? (
          <Text style={styles.checkDetails} numberOfLines={3}>
            {check.details}
          </Text>
        ) : null}
        {check.duration !== undefined ? (
          <Text style={styles.checkDuration}>{check.duration}ms</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function SupabaseCheckScreen() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<{ success: number; error: number; warning: number } | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setChecks([]);
    setSummary(null);
    progressAnim.setValue(0);
    startSpin();

    let count = 0;
    const totalExpected = 12;

    const results = await runFullVerification((check) => {
      count++;
      setChecks((prev) => {
        const idx = prev.findIndex((c) => c.id === check.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = check;
          return next;
        }
        return [...prev, check];
      });
      Animated.timing(progressAnim, {
        toValue: count / totalExpected,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    const s = results.filter((r) => r.status === 'success').length;
    const e = results.filter((r) => r.status === 'error').length;
    const w = results.filter((r) => r.status === 'warning').length;
    setSummary({ success: s, error: e, warning: w });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    setRunning(false);
  }, [progressAnim, startSpin]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const overallStatus: CheckStatus = summary
    ? summary.error > 0
      ? 'error'
      : summary.warning > 0
        ? 'warning'
        : 'success'
    : 'running';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Vérification Supabase',
          headerShown: true,
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />
      <View style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                {running ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <RefreshCw size={36} color="#60A5FA" />
                  </Animated.View>
                ) : (
                  <StatusIcon status={overallStatus} size={36} />
                )}
              </View>
              <Text style={styles.heroTitle}>
                {running
                  ? 'Vérification en cours...'
                  : summary?.error
                    ? `${summary.error} problème(s) détecté(s)`
                    : summary?.warning
                      ? `Tout fonctionne (${summary.warning} avertissement(s))`
                      : 'Tout est opérationnel'}
              </Text>
              <View style={styles.progressBarWrap}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressWidth,
                      backgroundColor: running
                        ? '#60A5FA'
                        : STATUS_COLORS[overallStatus],
                    },
                  ]}
                />
              </View>
              {summary && (
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <CheckCircle size={14} color="#30D158" />
                    <Text style={styles.summaryText}>{summary.success}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <AlertTriangle size={14} color="#FF9F0A" />
                    <Text style={styles.summaryText}>{summary.warning}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <XCircle size={14} color="#FF453A" />
                    <Text style={styles.summaryText}>{summary.error}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.checksContainer}>
              {checks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.retryButton, running && styles.retryButtonDisabled]}
              onPress={runChecks}
              disabled={running}
              activeOpacity={0.7}
            >
              <RefreshCw size={18} color={running ? '#8E8E93' : '#FFF'} />
              <Text style={[styles.retryText, running && styles.retryTextDisabled]}>
                {running ? 'En cours...' : 'Relancer la vérification'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Légende</Text>
              <View style={styles.legendRow}>
                <CheckCircle size={14} color="#30D158" />
                <Text style={styles.legendText}>Succès — Le service fonctionne</Text>
              </View>
              <View style={styles.legendRow}>
                <AlertTriangle size={14} color="#FF9F0A" />
                <Text style={styles.legendText}>Avertissement — RLS ou accès limité</Text>
              </View>
              <View style={styles.legendRow}>
                <XCircle size={14} color="#FF453A" />
                <Text style={styles.legendText}>Erreur — Service inaccessible</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarWrap: {
    width: '100%',
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#CBD5E1',
  },
  checksContainer: {
    gap: 8,
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  checkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkContent: {
    flex: 1,
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  checkMessage: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  checkDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  checkDuration: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  pendingDot: {
    backgroundColor: '#8E8E93',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  retryButtonDisabled: {
    backgroundColor: '#1E293B',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  retryTextDisabled: {
    color: '#8E8E93',
  },
  infoBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#CBD5E1',
  },
});
