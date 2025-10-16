import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import type { ChatMessage } from "@/types";

const messagesStore: Record<string, ChatMessage[]> = {};

export const getMessagesProcedure = publicProcedure
  .input(
    z.object({
      missionId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const messages = messagesStore[input.missionId] || [];
    
    console.log('[Chat] Fetching messages for mission:', input.missionId, 'Count:', messages.length);

    return messages;
  });

export function addMessageToStore(message: ChatMessage) {
  if (!messagesStore[message.missionId]) {
    messagesStore[message.missionId] = [];
  }
  messagesStore[message.missionId].push(message);
}
