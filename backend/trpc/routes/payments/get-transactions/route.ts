import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const getTransactionsProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      userType: z.enum(['client', 'artisan']),
    })
  )
  .query(async ({ input }) => {
    console.log('Fetching transactions for user:', input.userId);

    return [];
  });
