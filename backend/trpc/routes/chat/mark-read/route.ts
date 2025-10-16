import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const markReadProcedure = publicProcedure
  .input(
    z.object({
      missionId: z.string(),
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Chat] Marking messages as read for user:', input.userId, 'mission:', input.missionId);

    return { success: true };
  });
