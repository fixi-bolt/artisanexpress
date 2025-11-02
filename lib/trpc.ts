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

        return fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
        }).then(async (response) => {
          clearTimeout(timeoutId);
          return response;
        }).catch((error) => {
          clearTimeout(timeoutId);
          throw error;
        });
      },
    }),
  ],
});
