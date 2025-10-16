import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

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
  .mutation(async ({ input }) => {
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

    return notification;
  });
