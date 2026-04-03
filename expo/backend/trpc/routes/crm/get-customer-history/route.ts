import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const getCustomerHistoryProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log('[CRM] Getting customer history for:', input.userId);

    const mockHistory = {
      missions: [
        {
          id: 'mission_1',
          category: 'plumber',
          title: 'Fix leaking pipe',
          status: 'completed',
          amount: 450,
          date: new Date('2025-10-10').toISOString(),
          rating: 5,
        },
        {
          id: 'mission_2',
          category: 'electrician',
          title: 'Install new outlet',
          status: 'completed',
          amount: 380,
          date: new Date('2025-09-20').toISOString(),
          rating: 4.8,
        },
        {
          id: 'mission_3',
          category: 'plumber',
          title: 'Unclog drain',
          status: 'completed',
          amount: 280,
          date: new Date('2025-08-15').toISOString(),
          rating: 4.9,
        },
      ],
      transactions: [
        {
          id: 'tx_1',
          missionId: 'mission_1',
          amount: 450,
          status: 'completed',
          date: new Date('2025-10-10').toISOString(),
          method: 'card',
        },
        {
          id: 'tx_2',
          missionId: 'mission_2',
          amount: 380,
          status: 'completed',
          date: new Date('2025-09-20').toISOString(),
          method: 'card',
        },
        {
          id: 'tx_3',
          missionId: 'mission_3',
          amount: 280,
          status: 'completed',
          date: new Date('2025-08-15').toISOString(),
          method: 'paypal',
        },
      ],
      communications: [
        {
          id: 'comm_1',
          type: 'email',
          subject: 'Your mission is completed',
          date: new Date('2025-10-10').toISOString(),
          status: 'delivered',
        },
        {
          id: 'comm_2',
          type: 'push',
          subject: 'Rate your experience',
          date: new Date('2025-10-11').toISOString(),
          status: 'delivered',
        },
        {
          id: 'comm_3',
          type: 'sms',
          subject: 'Your artisan is on the way',
          date: new Date('2025-10-10').toISOString(),
          status: 'delivered',
        },
      ],
    };

    return mockHistory;
  });
