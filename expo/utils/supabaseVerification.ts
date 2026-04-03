import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export type CheckStatus = 'pending' | 'running' | 'success' | 'error' | 'warning';

export type CheckResult = {
  id: string;
  label: string;
  status: CheckStatus;
  message?: string;
  details?: string;
  duration?: number;
};

const EXPECTED_TABLES = [
  'users',
  'artisans',
  'clients',
  'admins',
  'missions',
  'notifications',
  'transactions',
];

async function timedCheck<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, duration: Date.now() - start };
}

export async function checkConnection(): Promise<CheckResult> {
  const id = 'connection';
  const label = 'Connexion Supabase';
  try {
    const { result, duration } = await timedCheck(async () => {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      if (!url || !key) {
        return { success: false, error: 'URL ou clé anon manquante' };
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return { success: res.ok || res.status === 200, status: res.status };
    });

    if (result.success) {
      return { id, label, status: 'success', message: `Connecté (${duration}ms)`, duration };
    }
    return { id, label, status: 'error', message: `HTTP ${(result as any).status}`, duration };
  } catch (e: any) {
    console.error('[checkConnection]', e.message);
    return { id, label, status: 'error', message: e.name === 'AbortError' ? 'Timeout (10s)' : e.message };
  }
}

export async function checkAuth(): Promise<CheckResult> {
  const id = 'auth';
  const label = 'Service Auth';
  try {
    const { result, duration } = await timedCheck(async () => {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    });

    if (result.error) {
      return { id, label, status: 'error', message: result.error.message, duration };
    }

    const hasSession = !!result.data?.session;
    return {
      id,
      label,
      status: 'success',
      message: hasSession
        ? `Authentifié: ${result.data.session?.user?.email ?? 'N/A'}`
        : 'Service OK (non connecté)',
      duration,
    };
  } catch (e: any) {
    console.error('[checkAuth]', e.message);
    return { id, label, status: 'error', message: e.message };
  }
}

export async function checkTable(tableName: string): Promise<CheckResult> {
  const id = `table_${tableName}`;
  const label = `Table: ${tableName}`;
  try {
    const { result, duration } = await timedCheck(async () => {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      return { data, error, count };
    });

    if (result.error) {
      const msg = result.error.message;
      if (msg.includes('does not exist') || msg.includes('relation')) {
        return { id, label, status: 'error', message: 'Table inexistante', details: msg, duration };
      }
      if (msg.includes('permission denied') || msg.includes('RLS')) {
        return { id, label, status: 'warning', message: 'RLS bloque (normal sans auth)', details: msg, duration };
      }
      return { id, label, status: 'warning', message: msg, duration };
    }

    return {
      id,
      label,
      status: 'success',
      message: `OK — ${result.count ?? 0} ligne(s)`,
      duration,
    };
  } catch (e: any) {
    console.error(`[checkTable:${tableName}]`, e.message);
    return { id, label, status: 'error', message: e.message };
  }
}

export async function checkRealtime(): Promise<CheckResult> {
  const id = 'realtime';
  const label = 'Realtime (WebSocket)';

  if (Platform.OS === 'web') {
    return { id, label, status: 'warning', message: 'Test limité sur web' };
  }

  try {
    const { duration } = await timedCheck(async () => {
      return new Promise<boolean>((resolve) => {
        const channel = supabase.channel('verify-test');
        const timeout = setTimeout(() => {
          void channel.unsubscribe();
          resolve(false);
        }, 5000);

        channel
          .on('system' as any, {} as any, () => {
            clearTimeout(timeout);
            void channel.unsubscribe();
            resolve(true);
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              void channel.unsubscribe();
              resolve(true);
            }
          });
      });
    });

    return { id, label, status: 'success', message: `Connecté (${duration}ms)`, duration };
  } catch (e: any) {
    console.error('[checkRealtime]', e.message);
    return { id, label, status: 'warning', message: e.message };
  }
}

export async function checkStorage(): Promise<CheckResult> {
  const id = 'storage';
  const label = 'Storage (Buckets)';
  try {
    const { result, duration } = await timedCheck(async () => {
      const { data, error } = await supabase.storage.listBuckets();
      return { data, error };
    });

    if (result.error) {
      return { id, label, status: 'warning', message: result.error.message, duration };
    }

    const bucketNames = (result.data || []).map((b: any) => b.name).join(', ');
    return {
      id,
      label,
      status: 'success',
      message: result.data?.length
        ? `${result.data.length} bucket(s): ${bucketNames}`
        : 'Aucun bucket',
      duration,
    };
  } catch (e: any) {
    console.error('[checkStorage]', e.message);
    return { id, label, status: 'error', message: e.message };
  }
}

export async function checkEnvVars(): Promise<CheckResult> {
  const id = 'env';
  const label = 'Variables d\'environnement';

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  const issues: string[] = [];
  if (!url) issues.push('EXPO_PUBLIC_SUPABASE_URL manquante');
  if (!key) issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY manquante');

  if (url && !url.startsWith('https://')) {
    issues.push('URL ne commence pas par https://');
  }
  if (url && !url.includes('.supabase.co')) {
    issues.push('URL ne contient pas .supabase.co');
  }

  if (issues.length > 0) {
    return { id, label, status: 'error', message: issues.join(' | '), details: `URL: ${url || '(vide)'}\nKey: ${key ? key.substring(0, 20) + '...' : '(vide)'}` };
  }

  return {
    id,
    label,
    status: 'success',
    message: `URL: ${url.replace('https://', '').split('.')[0]}...supabase.co`,
    details: `Clé: ${key.substring(0, 20)}...`,
  };
}

export type VerificationCallback = (check: CheckResult) => void;

export async function runFullVerification(onProgress: VerificationCallback): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const pushResult = (r: CheckResult) => {
    results.push(r);
    onProgress(r);
  };

  pushResult(await checkEnvVars());
  pushResult(await checkConnection());
  pushResult(await checkAuth());

  for (const table of EXPECTED_TABLES) {
    pushResult(await checkTable(table));
  }

  pushResult(await checkStorage());
  pushResult(await checkRealtime());

  return results;
}
