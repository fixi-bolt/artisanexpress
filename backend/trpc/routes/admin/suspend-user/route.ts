import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

export const suspendUserAdminProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      reason: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Suspending user:', input.userId, 'Reason:', input.reason);
    
    return {
      success: true,
      message: `User ${input.userId} suspended`,
    };
  });
