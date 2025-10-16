import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Wallet } from "@/types";

export const getWalletProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
    })
  )
  .query(({ input }) => {
    console.log("[WALLET] Getting wallet for artisan:", input.artisanId);

    const mockWallet: Wallet = {
      id: `wallet-${input.artisanId}`,
      artisanId: input.artisanId,
      balance: 1245.50,
      pendingBalance: 320.00,
      totalEarnings: 8650.75,
      totalWithdrawals: 7085.25,
      currency: "EUR",
    };

    return {
      wallet: mockWallet,
      canWithdraw: mockWallet.balance >= 50,
      minimumWithdrawal: 50,
      estimatedProcessingTime: "2-3 jours ouvrés",
    };
  });
