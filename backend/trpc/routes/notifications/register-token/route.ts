import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const registerTokenProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      token: z.string(),
      platform: z.enum(['ios', 'android', 'web']).optional(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const { error } = await supabase
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

export async function getPushToken(userId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[Notifications] No push token found for user:', userId);
      return undefined;
    }

    return data.token;
  } catch (error) {
    console.error('[Notifications] Error fetching push token:', error);
    return undefined;
  }
}
