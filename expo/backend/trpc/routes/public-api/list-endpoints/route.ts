import { publicProcedure } from "@/backend/trpc/create-context";

export const listEndpointsProcedure = publicProcedure.query(() => {
  console.log("[publicApi.listEndpoints] listing endpoints");
  return [
    {
      name: "Create Mission",
      method: "POST",
      path: "/api/public/missions",
      description: "Create a new mission on behalf of a client",
      exampleCurl: "curl -X POST https://api.artisannow.com/api/public/missions -H 'Authorization: Bearer <API_KEY>' -H 'Content-Type: application/json' -d '{\"title\":\"Fuite d\'eau\",\"category\":\"plumber\",\"location\":{\"latitude\":48.85,\"longitude\":2.35}}'",
    },
    {
      name: "Get Artisans",
      method: "GET",
      path: "/api/public/artisans?category=plumber",
      description: "List available artisans filtered by category",
      exampleCurl: "curl 'https://api.artisannow.com/api/public/artisans?category=plumber' -H 'Authorization: Bearer <API_KEY>'",
    },
    {
      name: "Get Mission Status",
      method: "GET",
      path: "/api/public/missions/{id}",
      description: "Retrieve mission status and assigned artisan",
      exampleCurl: "curl 'https://api.artisannow.com/api/public/missions/123' -H 'Authorization: Bearer <API_KEY>'",
    },
  ];
});

export default listEndpointsProcedure;