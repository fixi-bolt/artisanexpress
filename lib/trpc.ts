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
const BACKEND_AVAILABLE = true;

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        if (!BACKEND_AVAILABLE) {
          if (!backendErrorLogged) {
            console.warn('⚠️ Backend désactivé - Mode hors ligne');
            console.warn('Les fonctionnalités nécessitant le backend ne seront pas disponibles');
            backendErrorLogged = true;
          }
          return Promise.reject(new Error('Backend unavailable'));
        }

        const controller = new AbortController();
        const timeoutMs = 30000;
        const timeoutId = setTimeout(() => {
          console.warn('[trpc] Request timeout après', timeoutMs, 'ms pour', url);
          controller.abort();
        }, timeoutMs);

        return fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
        }).then(async (response) => {
          clearTimeout(timeoutId);
          const contentType = response.headers.get('content-type');
          
          if (!contentType || !contentType.includes('application/json')) {
            if (!backendErrorLogged) {
              console.warn('⚠️ Backend non disponible - Mode hors ligne activé');
              console.warn(`URL tentée: ${getBaseUrl()}/api/trpc`);
              console.warn(`Status: ${response.status}`);
              backendErrorLogged = true;
            }
            
            throw new Error(
              `Backend unavailable (Status ${response.status})`
            );
          }
          
          return response;
        }).catch((error) => {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            console.error('[trpc] Requête annulée (timeout ou abort manuel) pour', url);
            throw new Error(`Request timeout - Backend trop lent ou injoignable`);
          }
          
          if (!backendErrorLogged) {
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
