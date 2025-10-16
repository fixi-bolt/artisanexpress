import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

export const deleteMissionAdminProcedure = publicProcedure
  .input(
    z.object({
      missionId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Deleting mission:', input.missionId);
    
    return {
      success: true,
      message: `Mission ${input.missionId} deleted`,
    };
  });
