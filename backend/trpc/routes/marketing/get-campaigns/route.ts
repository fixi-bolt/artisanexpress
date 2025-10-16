import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const getCampaignsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(['active', 'scheduled', 'completed', 'all']).optional(),
    })
  )
  .query(async ({ input }) => {
    console.log('[Marketing] Getting campaigns:', input);

    const mockCampaigns = [
      {
        id: 'camp_1',
        name: 'Summer Promotion 2025',
        type: 'email' as const,
        status: 'active' as const,
        targetAudience: 'all_users',
        startDate: new Date('2025-06-01').toISOString(),
        endDate: new Date('2025-08-31').toISOString(),
        budget: 5000,
        spent: 3250,
        impressions: 45000,
        clicks: 2340,
        conversions: 178,
        revenue: 12400,
        roi: 281,
        createdAt: new Date('2025-05-15').toISOString(),
      },
      {
        id: 'camp_2',
        name: 'Artisan Referral Program',
        type: 'referral' as const,
        status: 'active' as const,
        targetAudience: 'artisans',
        startDate: new Date('2025-05-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString(),
        budget: 10000,
        spent: 4200,
        impressions: 0,
        clicks: 0,
        conversions: 89,
        revenue: 8900,
        roi: 111,
        createdAt: new Date('2025-04-20').toISOString(),
      },
      {
        id: 'camp_3',
        name: 'Client Welcome Series',
        type: 'email' as const,
        status: 'active' as const,
        targetAudience: 'new_clients',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: null,
        budget: 3000,
        spent: 1890,
        impressions: 12500,
        clicks: 890,
        conversions: 234,
        revenue: 18700,
        roi: 890,
        createdAt: new Date('2024-12-15').toISOString(),
      },
      {
        id: 'camp_4',
        name: 'Black Friday Special',
        type: 'push' as const,
        status: 'scheduled' as const,
        targetAudience: 'all_users',
        startDate: new Date('2025-11-24').toISOString(),
        endDate: new Date('2025-11-27').toISOString(),
        budget: 8000,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        roi: 0,
        createdAt: new Date('2025-10-01').toISOString(),
      },
      {
        id: 'camp_5',
        name: 'Spring Maintenance Campaign',
        type: 'sms' as const,
        status: 'completed' as const,
        targetAudience: 'inactive_clients',
        startDate: new Date('2025-03-01').toISOString(),
        endDate: new Date('2025-04-30').toISOString(),
        budget: 4000,
        spent: 3890,
        impressions: 8900,
        clicks: 1234,
        conversions: 156,
        revenue: 15600,
        roi: 301,
        createdAt: new Date('2025-02-15').toISOString(),
      },
    ];

    const filtered = input.status && input.status !== 'all'
      ? mockCampaigns.filter(c => c.status === input.status)
      : mockCampaigns;

    return {
      campaigns: filtered,
      totalCount: filtered.length,
    };
  });
