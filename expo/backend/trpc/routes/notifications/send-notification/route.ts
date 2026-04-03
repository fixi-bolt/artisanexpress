import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const sendNotificationProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      title: z.string(),
      message: z.string(),
      type: z.enum(['mission_request', 'mission_accepted', 'mission_completed', 'payment', 'chat']),
      missionId: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const notification = {
      id: Math.random().toString(36).substring(7),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      missionId: input.missionId,
      read: false,
      createdAt: new Date(),
    };

    console.log('[Notifications] Sending notification:', notification);

    setImmediate(async () => {
      try {
        const { data: tokenData } = await ctx.supabase
          .from('push_tokens')
          .select('token')
          .eq('user_id', input.userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const pushToken = tokenData?.token;

        if (pushToken && Expo.isExpoPushToken(pushToken)) {
          const messages: ExpoPushMessage[] = [
            {
              to: pushToken,
              sound: 'default',
              title: input.title,
              body: input.message,
              data: {
                type: input.type,
                missionId: input.missionId,
                ...input.data,
              },
            },
          ];

          const chunks = expo.chunkPushNotifications(messages);
          const tickets = [];

          for (const chunk of chunks) {
            try {
              const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
              console.log('[Notifications] Push sent successfully:', ticketChunk);
              tickets.push(...ticketChunk);
            } catch (error) {
              console.error('[Notifications] Error sending push chunk:', error);
            }
          }

          console.log('[Notifications] All push notifications sent');
        } else {
          console.warn('[Notifications] No valid push token for user:', input.userId);
        }
      } catch (error) {
        console.error('[Notifications] Error in background push send:', error);
      }
    });

    return notification;
  });
