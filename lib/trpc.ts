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
            const text = await response.text();
            
            if (!backendErrorLogged) {
              console.error('\n🚨 BACKEND CONNECTION ERROR 🚨');
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.error('The backend server is not responding properly.');
              console.error(`Backend URL: ${getBaseUrl()}/api/trpc`);
              console.error(`Status: ${response.status}`);
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.error('\nPossible solutions:');
              console.error('1. The backend may need to be restarted');
              console.error('2. Check if the backend deployment is active');
              console.error('3. Verify the EXPO_PUBLIC_RORK_API_BASE_URL in .env');
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              backendErrorLogged = true;
            }
            
            throw new Error(
              `Backend server error (Status ${response.status}). The backend may need to be restarted.`
            );
          }
          
          return response;
        }).catch((error) => {
          if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
            if (!backendErrorLogged) {
              console.error('\n🚨 NETWORK ERROR 🚨');
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.error('Cannot connect to backend server.');
              console.error(`Backend URL: ${getBaseUrl()}/api/trpc`);
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.error('\nPossible causes:');
              console.error('1. No internet connection');
              console.error('2. Backend server is down');
              console.error('3. Firewall blocking the connection');
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━\n');
              backendErrorLogged = true;
            }
          }
          throw error;
        });
      },
    }),
  ],
});
