import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { runFullDiagnostic } from '@/utils/networkDiagnostics';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';

type DiagnosticResult = {
  info: any;
  basicConnectivity: { success: boolean; error?: string; details?: any };
  supabaseConnection: { success: boolean; error?: string; details?: any };
};

export function ConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [supabaseTest, setSupabaseTest] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const runTests = async () => {
    setTesting(true);
    setDiagnosticResult(null);
    setSupabaseTest(null);

    const result = await runFullDiagnostic();
    setDiagnosticResult(result);

    if (result.supabaseConnection.success) {
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
          setSupabaseTest({ success: false, error: error.message });
        } else {
          setSupabaseTest({ success: true });
        }
      } catch (error: any) {
        setSupabaseTest({ success: false, error: error.message });
      }
    }

    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <AlertCircle size={32} color="#FF9500" />
        <Text style={styles.title}>Diagnostic réseau</Text>
      </View>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={runTests}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <>
            <RefreshCw size={20} color="#007AFF" />
            <Text style={styles.refreshText}>Relancer le diagnostic</Text>
          </>
        )}
      </TouchableOpacity>

      {diagnosticResult && (
        <>
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              {diagnosticResult.basicConnectivity.success ? (
                <Wifi size={24} color="#34C759" />
              ) : (
                <WifiOff size={24} color="#FF3B30" />
              )}
              <Text style={[
                styles.sectionTitle,
                { color: diagnosticResult.basicConnectivity.success ? '#34C759' : '#FF3B30' }
              ]}>
                Connexion Internet
              </Text>
            </View>
            
            {diagnosticResult.basicConnectivity.success ? (
              <Text style={styles.successText}>
                ✓ Connexion Internet active
              </Text>
            ) : (
              <Text style={styles.errorText}>
                ✗ {diagnosticResult.basicConnectivity.error}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations système</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Plateforme:</Text>
              <Text style={styles.value}>{diagnosticResult.info.platform}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Environnement:</Text>
              <Text style={styles.value}>{diagnosticResult.info.environment}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>URL Supabase:</Text>
              <Text style={styles.valueSmall} numberOfLines={1}>
                {diagnosticResult.info.supabaseUrl || 'Non défini'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Clé API:</Text>
              <Text style={styles.value}>
                {diagnosticResult.info.hasAnonKey ? '✓ Présente' : '✗ Manquante'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.resultHeader}>
              {diagnosticResult.supabaseConnection.success ? (
                <CheckCircle size={24} color="#34C759" />
              ) : (
                <XCircle size={24} color="#FF3B30" />
              )}
              <Text style={[
                styles.sectionTitle,
                { color: diagnosticResult.supabaseConnection.success ? '#34C759' : '#FF3B30' }
              ]}>
                Connexion Supabase
              </Text>
            </View>
            
            {diagnosticResult.supabaseConnection.success ? (
              <View>
                <Text style={styles.successText}>
                  ✓ Connexion au serveur Supabase réussie
                </Text>
                {diagnosticResult.supabaseConnection.details && (
                  <View style={styles.successDetails}>
                    <Text style={styles.detailsLabel}>Status HTTP:</Text>
                    <Text style={styles.detailsText}>
                      {diagnosticResult.supabaseConnection.details.status} - {diagnosticResult.supabaseConnection.details.statusText}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.errorText}>{diagnosticResult.supabaseConnection.error}</Text>
                {diagnosticResult.supabaseConnection.details && (
                  <View style={styles.details}>
                    <Text style={styles.detailsLabel}>Détails de l&apos;erreur:</Text>
                    <Text style={styles.detailsText}>
                      Type: {diagnosticResult.supabaseConnection.details.name}
                    </Text>
                    <Text style={styles.detailsText}>
                      Message: {diagnosticResult.supabaseConnection.details.message}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </>
      )}

      {supabaseTest && (
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            {supabaseTest.success ? (
              <CheckCircle size={24} color="#34C759" />
            ) : (
              <XCircle size={24} color="#FF3B30" />
            )}
            <Text style={[
              styles.sectionTitle,
              { color: supabaseTest.success ? '#34C759' : '#FF3B30' }
            ]}>
              Test de requête Supabase
            </Text>
          </View>
          
          {supabaseTest.success ? (
            <Text style={styles.successText}>
              ✓ Requête à la base de données réussie
            </Text>
          ) : (
            <Text style={styles.errorText}>✗ {supabaseTest.error}</Text>
          )}
        </View>
      )}

      <View style={styles.help}>
        <Text style={styles.helpTitle}>Solutions possibles:</Text>
        <Text style={styles.helpText}>
          • Vérifiez votre connexion Internet{'\n'}
          • Assurez-vous que le WiFi est activé{'\n'}
          • Vérifiez que les clés Supabase sont correctes{'\n'}
          • Essayez de redémarrer l&apos;application
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  successText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
    marginBottom: 8,
  },
  details: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  successDetails: {
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  help: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
