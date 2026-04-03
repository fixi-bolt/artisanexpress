import { publicProcedure } from '../../../create-context';
import { mockMissions } from '@/mocks/missions';
import { Mission } from '@/types';
import { z } from 'zod';

export const getMissionsAdminProcedure = publicProcedure
  .input(
    z.object({
      status: z.enum(['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled']).optional(),
    })
  )
  .query(async ({ input }): Promise<Mission[]> => {
    if (!input.status || input.status === 'all') {
      return mockMissions;
    }

    return mockMissions.filter(m => m.status === input.status);
  });
