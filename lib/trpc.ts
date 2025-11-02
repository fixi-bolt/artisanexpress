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
        const timeoutMs = 10000;
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
          
          if (response.status === 404) {
            const text = await response.text().catch(() => '');
            console.error('[trpc] 404 Not Found:', url, text);
            throw new Error(`Backend unavailable (Status ${response.status})`);
          }

          if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('[trpc] HTTP error', response.status, url, text);
            throw new Error(`Backend error (Status ${response.status})`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('[trpc] Non-JSON response:', contentType, 'for', url);
          }
          
          return response;
        }).catch((error) => {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            console.warn('[trpc] Timeout après', timeoutMs, 'ms pour', url);
            return Promise.resolve(new Response(JSON.stringify({ error: { message: 'Timeout' } }), {
              status: 408,
              headers: { 'Content-Type': 'application/json' },
            }));
          }
          
          throw error;
        });
      },
    }),
  ],
});
