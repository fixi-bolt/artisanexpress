import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const requestPartnershipProcedure = protectedProcedure
  .input(
    z.object({
      companyName: z.string().min(2),
      contactEmail: z.string().email(),
      message: z.string().min(10),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Monetization.requestPartnership', input);

    return { success: true, ticketId: `b2b_${Date.now()}` } as const;
  });
