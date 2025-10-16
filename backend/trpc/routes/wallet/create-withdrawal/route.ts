import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Withdrawal } from "@/types";

export const createWithdrawalProcedure = protectedProcedure
  .input(
    z.object({
      artisanId: z.string(),
      amount: z.number().min(50),
      method: z.enum(["bank_transfer", "paypal"]),
      accountDetails: z.object({
        iban: z.string().optional(),
        paypalEmail: z.string().email().optional(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[WALLET] Creating withdrawal:", input);

    const { artisanId, amount, method, accountDetails } = input;

    if (method === "bank_transfer" && !accountDetails.iban) {
      throw new Error("IBAN requis pour un virement bancaire");
    }

    if (method === "paypal" && !accountDetails.paypalEmail) {
      throw new Error("Email PayPal requis");
    }

    const withdrawal: Withdrawal = {
      id: `wdr-${Date.now()}`,
      walletId: `wallet-${artisanId}`,
      artisanId,
      amount,
      status: "pending",
      method,
      createdAt: new Date(),
    };

    console.log(`[WALLET] Withdrawal created: ${withdrawal.id}`);
    console.log(`[WALLET] Processing ${method} withdrawal of €${amount}`);

    return {
      withdrawal,
      message: "Demande de retrait soumise avec succès",
      estimatedCompletion: calculateEstimatedCompletion(method),
    };
  });

function calculateEstimatedCompletion(method: "bank_transfer" | "paypal"): Date {
  const completion = new Date();
  if (method === "bank_transfer") {
    completion.setDate(completion.getDate() + 3);
  } else {
    completion.setDate(completion.getDate() + 1);
  }
  return completion;
}
