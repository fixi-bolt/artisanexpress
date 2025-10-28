import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

let backendErrorLogged = false;

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
        }).then(async (response) => {
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
          if (!backendErrorLogged) {
            console.warn('⚠️ Connexion backend impossible - Mode hors ligne');
            backendErrorLogged = true;
          }
          throw error;
        });
      },
    }),
  ],
});
