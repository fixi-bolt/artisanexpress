import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { addMessageToStore } from "../get-messages/route";
import type { ChatMessage } from "@/types";

export const sendMessageProcedure = publicProcedure
  .input(
    z.object({
      missionId: z.string(),
      senderId: z.string(),
      senderName: z.string(),
      senderType: z.enum(['client', 'artisan']),
      content: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      missionId: input.missionId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderType: input.senderType,
      content: input.content,
      createdAt: new Date(),
      read: false,
    };

    addMessageToStore(message);

    console.log('[Chat] Message sent:', message);

    return message;
  });
