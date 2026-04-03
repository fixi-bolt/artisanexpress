import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

function generateKey(): string {
  const part = () => Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AN_${part()}_${part()}_${Date.now()}`;
}

export const createApiKeyProcedure = protectedProcedure
  .input(z.object({ label: z.string().min(1).max(50).optional() }).optional())
  .mutation(async ({ input }) => {
    console.log("[publicApi.createApiKey] creating key", input ?? {});
    const apiKey = generateKey();
    const createdAt = new Date();

    return {
      apiKey,
      label: input?.label ?? "default",
      createdAt,
    };
  });

export default createApiKeyProcedure;