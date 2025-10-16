import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Invoice } from "@/types";

export const generateInvoiceProcedure = protectedProcedure
  .input(
    z.object({
      missionId: z.string(),
      transactionId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[INVOICE] Generating invoice:", input);

    const { missionId, transactionId } = input;

    const invoiceNumber = generateInvoiceNumber();
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      missionId,
      transactionId,
      clientId: "cli-1",
      artisanId: "art-1",
      invoiceNumber,
      amount: 135.00,
      tax: 27.00,
      totalAmount: 162.00,
      issueDate,
      dueDate,
      status: "paid",
    };

    const pdfData = generateInvoicePDF(invoice);
    
    invoice.pdfUrl = `data:application/pdf;base64,${pdfData}`;

    console.log(`[INVOICE] Invoice ${invoiceNumber} generated successfully`);

    return {
      invoice,
      message: "Facture générée avec succès",
      downloadUrl: invoice.pdfUrl,
    };
  });

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}${month}-${random}`;
}

function generateInvoicePDF(invoice: Invoice): string {
  const pdfContent = `
ArtisanNow - FACTURE

Numéro: ${invoice.invoiceNumber}
Date d'émission: ${invoice.issueDate.toLocaleDateString("fr-FR")}
Date d'échéance: ${invoice.dueDate.toLocaleDateString("fr-FR")}

Mission ID: ${invoice.missionId}
Transaction ID: ${invoice.transactionId}

MONTANT HT: ${invoice.amount.toFixed(2)} €
TVA (20%): ${invoice.tax.toFixed(2)} €
TOTAL TTC: ${invoice.totalAmount.toFixed(2)} €

Statut: ${invoice.status.toUpperCase()}

Merci pour votre confiance!
ArtisanNow - Service d'artisans à la demande
`;

  return Buffer.from(pdfContent).toString("base64");
}
