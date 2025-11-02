import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  return 'http://localhost:3000';
};

let backendErrorLogged = false;
const BACKEND_AVAILABLE = false;

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        if (!BACKEND_AVAILABLE) {
          if (!backendErrorLogged) {
            console.log('ℹ️ Mode hors ligne - Backend désactivé');
            console.log('📱 L\'application fonctionne avec Supabase uniquement');
            backendErrorLogged = true;
          }
          return Promise.reject(new Error('Backend désactivé - Mode Supabase uniquement'));
        }

        const controller = new AbortController();
        const timeoutMs = 5000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        console.debug('[trpc] Fetching', url);

        return fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
        })
        .then(async (response) => {
          clearTimeout(timeoutId);

          if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('[trpc] 404 Not Found:', url, text);
            
            if (response.status === 404) {
              throw new Error(`Backend unavailable (Status ${response.status})`);
            }
            throw new Error(`Backend error (Status ${response.status})`);
          }

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            console.warn('[trpc] Unexpected content-type:', contentType, 'for', url);
          }

          return response;
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            console.error('[trpc] Requête annulée (timeout ou abort manuel) pour', url);
          } else if (!backendErrorLogged) {
            console.warn('⚠️ Connexion backend impossible - Mode hors ligne');
            console.warn('Erreur:', error.message);
            backendErrorLogged = true;
          }
          
          throw error;
        });
      },
    }),
  ],
});
