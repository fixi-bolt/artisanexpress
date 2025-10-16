import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import type { Invoice } from "@/types";

export const getInvoicesProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      userType: z.enum(["client", "artisan"]),
      limit: z.number().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
    })
  )
  .query(({ input }) => {
    console.log("[INVOICE] Getting invoices:", input);

    const { userId, userType, limit = 20, status } = input;

    const mockInvoices: Invoice[] = [
      {
        id: "inv-1",
        missionId: "mis-1",
        transactionId: "txn-1",
        clientId: "cli-1",
        artisanId: "art-1",
        invoiceNumber: "INV-202501-0001",
        amount: 135.00,
        tax: 27.00,
        totalAmount: 162.00,
        issueDate: new Date("2025-01-10"),
        dueDate: new Date("2025-02-09"),
        status: "paid",
        pdfUrl: "https://example.com/invoices/inv-1.pdf",
      },
      {
        id: "inv-2",
        missionId: "mis-2",
        transactionId: "txn-2",
        clientId: "cli-1",
        artisanId: "art-2",
        invoiceNumber: "INV-202501-0002",
        amount: 180.00,
        tax: 36.00,
        totalAmount: 216.00,
        issueDate: new Date("2025-01-13"),
        dueDate: new Date("2025-02-12"),
        status: "paid",
        pdfUrl: "https://example.com/invoices/inv-2.pdf",
      },
      {
        id: "inv-3",
        missionId: "mis-3",
        transactionId: "txn-3",
        clientId: "cli-1",
        artisanId: "art-3",
        invoiceNumber: "INV-202501-0003",
        amount: 95.00,
        tax: 19.00,
        totalAmount: 114.00,
        issueDate: new Date("2025-01-14"),
        dueDate: new Date("2025-02-13"),
        status: "sent",
        pdfUrl: "https://example.com/invoices/inv-3.pdf",
      },
    ];

    let filtered = mockInvoices.filter((inv) =>
      userType === "client" ? inv.clientId === userId : inv.artisanId === userId
    );

    if (status) {
      filtered = filtered.filter((inv) => inv.status === status);
    }

    const result = filtered.slice(0, limit);

    const summary = {
      totalInvoices: filtered.length,
      totalAmount: filtered.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: filtered
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingAmount: filtered
        .filter((inv) => inv.status === "sent")
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
    };

    return {
      invoices: result,
      summary,
      totalCount: filtered.length,
    };
  });
