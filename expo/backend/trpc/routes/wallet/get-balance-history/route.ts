import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

interface BalanceTransaction {
  id: string;
  type: "earning" | "withdrawal" | "commission" | "refund";
  amount: number;
  balance: number;
  description: string;
  missionId?: string;
  createdAt: Date;
}

export const getBalanceHistoryProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
      limit: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(({ input }) => {
    console.log("[WALLET] Getting balance history for artisan:", input.artisanId);

    const { limit = 50 } = input;

    const mockHistory: BalanceTransaction[] = [
      {
        id: "txn-1",
        type: "earning",
        amount: 135.00,
        balance: 1245.50,
        description: "Mission #mis-1 complétée - Fuite sous évier",
        missionId: "mis-1",
        createdAt: new Date("2025-01-15T14:30:00"),
      },
      {
        id: "txn-2",
        type: "withdrawal",
        amount: -500.00,
        balance: 1110.50,
        description: "Retrait vers compte bancaire",
        createdAt: new Date("2025-01-13T10:00:00"),
      },
      {
        id: "txn-3",
        type: "earning",
        amount: 180.00,
        balance: 1610.50,
        description: "Mission #mis-2 complétée - Panne électrique",
        missionId: "mis-2",
        createdAt: new Date("2025-01-12T16:45:00"),
      },
      {
        id: "txn-4",
        type: "commission",
        amount: -27.00,
        balance: 1430.50,
        description: "Commission plateforme (15%)",
        missionId: "mis-2",
        createdAt: new Date("2025-01-12T16:45:00"),
      },
      {
        id: "txn-5",
        type: "earning",
        amount: 95.00,
        balance: 1457.50,
        description: "Mission #mis-3 complétée - Porte claquée",
        missionId: "mis-3",
        createdAt: new Date("2025-01-10T11:20:00"),
      },
    ];

    const result = mockHistory.slice(0, limit);

    const analytics = {
      totalEarnings: mockHistory
        .filter((t) => t.type === "earning")
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: Math.abs(
        mockHistory
          .filter((t) => t.type === "withdrawal")
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      totalCommissions: Math.abs(
        mockHistory
          .filter((t) => t.type === "commission")
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      averageEarning:
        mockHistory.filter((t) => t.type === "earning").reduce((sum, t) => sum + t.amount, 0) /
        mockHistory.filter((t) => t.type === "earning").length,
    };

    return {
      history: result,
      totalCount: mockHistory.length,
      analytics,
    };
  });
