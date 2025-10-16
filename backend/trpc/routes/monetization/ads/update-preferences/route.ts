import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const updateAdPreferencesProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      personalizedAds: z.boolean(),
      allowPromotions: z.boolean(),
      categories: z.array(z.string()).max(10),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Monetization.updateAdPreferences', input);

    return { success: true } as const;
  });
