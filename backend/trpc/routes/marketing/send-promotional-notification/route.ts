import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const sendPromotionalNotificationProcedure = protectedProcedure
  .input(
    z.object({
      campaignId: z.string(),
      userIds: z.array(z.string()).optional(),
      targetAudience: z.string(),
      title: z.string(),
      message: z.string(),
      deepLink: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Marketing] Sending promotional notification:', input.title);

    const estimatedRecipients = input.userIds?.length || Math.floor(Math.random() * 1000 + 500);

    return {
      success: true,
      notificationId: `notif_${Date.now()}`,
      recipients: estimatedRecipients,
      estimatedDelivery: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  });
