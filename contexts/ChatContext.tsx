import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import type { ChatMessage } from '@/types';

export const [ChatProvider, useChat] = createContextHook(() => {
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { missionId: currentMissionId || '' },
    { enabled: !!currentMissionId }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    },
  });

  const markReadMutation = trpc.chat.markRead.useMutation();

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    if (currentMissionId) {
      const interval = setInterval(() => {
        messagesQuery.refetch();
      }, 3000);
      pollingIntervalRef.current = interval;

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [currentMissionId, messagesQuery]);

  const sendMessage = useCallback(
    async (content: string, senderId: string, senderName: string, senderType: 'client' | 'artisan') => {
      if (!currentMissionId) return;

      await sendMessageMutation.mutateAsync({
        missionId: currentMissionId,
        senderId,
        senderName,
        senderType,
        content,
      });
    },
    [currentMissionId, sendMessageMutation]
  );

  const markAsRead = useCallback(
    async (userId: string) => {
      if (!currentMissionId) return;

      await markReadMutation.mutateAsync({
        missionId: currentMissionId,
        userId,
      });
    },
    [currentMissionId, markReadMutation]
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
      isLoading: messagesQuery.isLoading,
      isSending: sendMessageMutation.isPending,
    }),
    [
      messages,
      currentMissionId,
      sendMessage,
      markAsRead,
      openChat,
      closeChat,
      messagesQuery.isLoading,
      sendMessageMutation.isPending,
    ]
  );
});
