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
let backendAvailable: boolean | null = null;
const MAX_SILENT_ERRORS = 3;
let errorCount = 0;

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        if (backendAvailable === false) {
          if (!backendErrorLogged) {
            console.warn('⚠️ Backend non accessible - Mode hors ligne activé');
            console.warn('Les fonctionnalités nécessitant le backend ne seront pas disponibles');
            backendErrorLogged = true;
          }
          return Promise.reject(new Error('Backend unavailable'));
        }

        const controller = new AbortController();
        const timeoutMs = 5000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        return fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
        }).then(async (response) => {
          clearTimeout(timeoutId);
          
          if (backendAvailable === null) {
            backendAvailable = true;
            console.log('✅ Backend connecté');
          }
          
          if (response.status === 404) {
            errorCount++;
            if (errorCount <= MAX_SILENT_ERRORS) {
              const text = await response.text().catch(() => '');
              console.error('[trpc] 404 Not Found:', url, text);
            }
            if (errorCount === MAX_SILENT_ERRORS) {
              console.warn('⚠️ Trop d\'erreurs backend - Mode silencieux activé');
              backendAvailable = false;
            }
            throw new Error(`Backend unavailable (Status ${response.status})`);
          }

          if (!response.ok) {
            errorCount++;
            if (errorCount <= MAX_SILENT_ERRORS) {
              const text = await response.text().catch(() => '');
              console.error('[trpc] HTTP error', response.status, url, text);
            }
            throw new Error(`Backend error (Status ${response.status})`);
          }
          
          errorCount = 0;
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            if (errorCount <= MAX_SILENT_ERRORS) {
              console.warn('[trpc] Non-JSON response:', contentType, 'for', url);
            }
          }
          
          return response;
        }).catch((error) => {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            errorCount++;
            if (errorCount <= MAX_SILENT_ERRORS) {
              console.warn('[trpc] Requête annulée (timeout ou abort manuel) pour', url);
            }
            if (errorCount === MAX_SILENT_ERRORS) {
              console.warn('⚠️ Trop de timeouts - Mode hors ligne activé');
              backendAvailable = false;
            }
            throw new Error('Request timeout');
          }
          
          throw error;
        });
      },
    }),
  ],
});
