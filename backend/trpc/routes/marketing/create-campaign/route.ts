import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const createCampaignProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      type: z.enum(['email', 'push', 'sms', 'referral']),
      targetAudience: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable(),
      budget: z.number(),
      content: z.object({
        subject: z.string().optional(),
        body: z.string(),
        cta: z.string().optional(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Marketing] Creating campaign:', input.name);

    const campaign = {
      id: `camp_${Date.now()}`,
      ...input,
      status: 'scheduled' as const,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      roi: 0,
      createdAt: new Date().toISOString(),
    };

    return { campaign };
  });
