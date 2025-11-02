import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import type { ChatMessage } from '@/types';

export const [ChatProvider, useChat] = createContextHook(() => {
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(
    async (content: string, senderId: string, senderName: string, senderType: 'client' | 'artisan') => {
      if (!currentMissionId) return;
      
      setIsSending(true);
      try {
        console.log('[Chat] Mode offline - Message non envoyé:', { content, senderId, senderName, senderType });
      } finally {
        setIsSending(false);
      }
    },
    [currentMissionId]
  );

  const markAsRead = useCallback(
    async (_userId: string) => {
      if (!currentMissionId) return;
      console.log('[Chat] Mode offline - Mark as read non disponible');
    },
    [currentMissionId]
  );

  const openChat = useCallback((missionId: string) => {
    setCurrentMissionId(missionId);
    setMessages([]);
  }, []);

  const closeChat = useCallback(() => {
    setCurrentMissionId(null);
    setMessages([]);
  }, []);

  return useMemo(
    () => ({
      messages,
      currentMissionId,
      sendMessage,
      markAsRead,
      openChat,
      closeChat,
      isLoading,
      isSending,
    }),
    [
      messages,
      currentMissionId,
      sendMessage,
      markAsRead,
      openChat,
      closeChat,
      isLoading,
      isSending,
    ]
  );
});
