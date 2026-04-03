import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Withdrawal } from "@/types";

export const getWithdrawalsProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
      limit: z.number().optional(),
      status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    })
  )
  .query(({ input }) => {
    console.log("[WALLET] Getting withdrawals for artisan:", input.artisanId);

    const { limit = 20, status } = input;

    const mockWithdrawals: Withdrawal[] = [
      {
        id: "wdr-1",
        walletId: `wallet-${input.artisanId}`,
        artisanId: input.artisanId,
        amount: 500.00,
        status: "completed",
        method: "bank_transfer",
        createdAt: new Date("2025-01-10"),
        processedAt: new Date("2025-01-13"),
      },
      {
        id: "wdr-2",
        walletId: `wallet-${input.artisanId}`,
        artisanId: input.artisanId,
        amount: 300.00,
        status: "processing",
        method: "paypal",
        createdAt: new Date("2025-01-14"),
      },
      {
        id: "wdr-3",
        walletId: `wallet-${input.artisanId}`,
        artisanId: input.artisanId,
        amount: 150.00,
        status: "pending",
        method: "bank_transfer",
        createdAt: new Date("2025-01-15"),
      },
    ];

    let filtered = mockWithdrawals;
    if (status) {
      filtered = filtered.filter((w) => w.status === status);
    }

    const result = filtered.slice(0, limit);

    return {
      withdrawals: result,
      totalCount: filtered.length,
      summary: {
        totalWithdrawn: mockWithdrawals
          .filter((w) => w.status === "completed")
          .reduce((sum, w) => sum + w.amount, 0),
        pendingAmount: mockWithdrawals
          .filter((w) => w.status === "pending" || w.status === "processing")
          .reduce((sum, w) => sum + w.amount, 0),
      },
    };
  });
