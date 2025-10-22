import React, { useCallback, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, FileText, ShieldCheck, AlertCircle } from 'lucide-react-native';

export default function SiretVerificationScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [siret, setSiret] = useState<string>('');
  const [kbisUrl, setKbisUrl] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [prefill, setPrefill] = useState<{ companyName?: string; address?: string; ape?: string } | null>(null);

  const verifyMutation = trpc.compliance.verifySiret.useMutation();

  const formattedSiret = useMemo(() => siret.replace(/\D/g, ''), [siret]);

  const onVerify = useCallback(async () => {
    setErrorText('');
    setPrefill(null);
    try {
      console.log('Verifying SIRET', formattedSiret);
      const res = await verifyMutation.mutateAsync({ siret: formattedSiret });
      if (!res.valid || !res.active) {
        setErrorText('Le numéro SIRET saisi est invalide ou ne correspond à aucune entreprise active.');
        return;
      }
      setPrefill({ companyName: res.companyName ?? '', address: res.address ?? '', ape: res.ape ?? '' });
    } catch (e: any) {
      console.error('SIRET verification error', e);
      setErrorText("Impossible de vérifier le SIRET pour le moment. Réessayez plus tard.");
    }
  }, [formattedSiret, verifyMutation]);

  const canSubmit = useMemo(() => {
    return (
      email.length > 3 && password.length >= 6 && name.length > 1 && formattedSiret.length === 14 && !!prefill && !verifyMutation.isPending
    );
  }, [email, password, name, formattedSiret, prefill, verifyMutation.isPending]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      console.log('Creating artisan after SIRET verification');
      await signUp(email, password, name, 'artisan', {
        siret: formattedSiret,
        kbisUrl: kbisUrl || undefined,
        companyName: prefill?.companyName,
        address: prefill?.address,
        ape: prefill?.ape,
      });
      setTimeout(() => {
        router.replace('/(artisan)/dashboard' as any);
      }, 300);
    } catch (e: any) {
      console.error('Signup error', e);
      setErrorText(e?.message ?? 'Erreur lors de la création du compte');
    }
  }, [canSubmit, email, password, name, signUp, formattedSiret, kbisUrl, prefill]);

  return (
    <View style={styles.container} testID="siretVerificationScreen">
      <Stack.Screen options={{ headerShown: true, title: 'Vérification SIRET' }} />
      <Text style={styles.title} testID="title">Inscription Artisan</Text>
      <View style={styles.card} testID="formCard">
        <Text style={styles.sectionTitle}>Compte</Text>
        <TextInput
          placeholder="Nom complet"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
          testID="inputName"
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          testID="inputEmail"
        />
        <TextInput
          placeholder="Mot de passe (min 6 caractères)"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          testID="inputPassword"
        />
      </View>

      <View style={styles.card} testID="siretCard">
        <Text style={styles.sectionTitle}>Vérification professionnelle</Text>
        <View style={styles.row}>
          <Building2 color={Colors.primary} size={20} />
          <TextInput
            placeholder="Numéro de SIRET"
            value={siret}
            onChangeText={setSiret}
            style={[styles.input, { flex: 1 }]}
            keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
            maxLength={18}
            testID="inputSiret"
          />
        </View>
        <TouchableOpacity onPress={onVerify} disabled={verifyMutation.isPending || formattedSiret.length !== 14} style={[styles.button, (verifyMutation.isPending || formattedSiret.length !== 14) && styles.buttonDisabled]} testID="verifyButton">
          <ShieldCheck color="#fff" size={18} />
          <Text style={styles.buttonText}>{verifyMutation.isPending ? 'Vérification...' : 'Vérifier le SIRET'}</Text>
        </TouchableOpacity>

        {!!prefill && (
          <View style={styles.prefill} testID="prefillBox">
            <Text style={styles.prefillLabel}>Nom de l’entreprise</Text>
            <Text style={styles.prefillValue}>{prefill.companyName || '—'}</Text>
            <Text style={styles.prefillLabel}>Adresse</Text>
            <Text style={styles.prefillValue}>{prefill.address || '—'}</Text>
            <Text style={styles.prefillLabel}>Activité principale (APE)</Text>
            <Text style={styles.prefillValue}>{prefill.ape || '—'}</Text>
          </View>
        )}

        <View style={styles.row}>
          <FileText color={Colors.primary} size={20} />
          <TextInput
            placeholder="Lien du Kbis (PDF/JPG/PNG) — optionnel"
            value={kbisUrl}
            onChangeText={setKbisUrl}
            style={[styles.input, { flex: 1 }]}
            autoCapitalize="none"
            testID="inputKbisUrl"
          />
        </View>
      </View>

      {!!errorText && (
        <View style={styles.errorBox} testID="errorBox">
          <AlertCircle color={Colors.error} size={18} />
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}

      <TouchableOpacity onPress={onSubmit} disabled={!canSubmit} style={[styles.cta, !canSubmit && styles.buttonDisabled]} testID="submitButton">
        <Text style={styles.ctaText}>Créer mon compte artisan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', color: Colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, marginBottom: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600' as const },
  prefill: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, marginTop: 6 },
  prefillLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  prefillValue: { fontSize: 14, color: Colors.text },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 10, borderRadius: 10, marginBottom: 12 },
  errorText: { color: Colors.error, flex: 1 },
  cta: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' as const, fontSize: 16 },
});
