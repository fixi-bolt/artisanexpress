import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const pushTokensStore: Record<string, string> = {};

export const registerTokenProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      token: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    pushTokensStore[input.userId] = input.token;
    
    console.log('[Notifications] Registered push token for user:', input.userId);

    return { success: true };
  });

export function getPushToken(userId: string): string | undefined {
  return pushTokensStore[userId];
}
