import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const getAdPreferencesProcedure = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    console.log('Monetization.getAdPreferences', input);

    return {
      personalizedAds: true,
      allowPromotions: true,
      categories: ['home_improvement', 'tools'],
    } as const;
  });
