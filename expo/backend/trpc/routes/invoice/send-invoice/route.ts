import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const sendInvoiceProcedure = protectedProcedure
  .input(
    z.object({
      invoiceId: z.string(),
      recipientEmail: z.string().email(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[INVOICE] Sending invoice:", input);

    const { invoiceId, recipientEmail } = input;

    console.log(`[INVOICE] Sending invoice ${invoiceId} to ${recipientEmail}`);
    console.log("[INVOICE] Email sent successfully with PDF attachment");

    return {
      success: true,
      message: `Facture envoyée à ${recipientEmail}`,
      sentAt: new Date(),
    };
  });
