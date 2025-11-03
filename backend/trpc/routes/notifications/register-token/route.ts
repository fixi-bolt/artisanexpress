import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const registerTokenProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      token: z.string(),
      platform: z.enum(['ios', 'android', 'web']).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const { error } = await ctx.supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: input.userId,
            token: input.token,
            platform: input.platform || 'ios',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        );

      if (error) {
        console.error('[Notifications] Error saving push token:', error);
        throw error;
      }

      console.log('[Notifications] Registered push token for user:', input.userId);
      return { success: true };
    } catch (error) {
      console.error('[Notifications] Failed to register push token:', error);
      throw error;
    }
  });


