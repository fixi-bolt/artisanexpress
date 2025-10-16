import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const addCustomerNoteProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      content: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[CRM] Adding customer note for:', input.userId);

    const note = {
      id: `note_${Date.now()}`,
      content: input.content,
      createdAt: new Date().toISOString(),
      author: 'Admin',
    };

    return { note };
  });
