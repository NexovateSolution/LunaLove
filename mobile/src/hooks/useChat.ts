import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import ApiService from '../services/api';
import WebSocketService from '../services/websocket';
import { ChatMessage, WebSocketMessage } from '../types';
import { useMatchStore } from '../store/matchStore';

export const useMatchMessages = (matchId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to WebSocket messages for this match
    const unsubscribe = WebSocketService.subscribe((message: WebSocketMessage) => {
      if (message.type === 'new_message' && message.data.match_id === matchId) {
        // Add new message to cache
        queryClient.setQueryData<ChatMessage[]>(
          ['matchMessages', matchId],
          (old = []) => [...old, message.data]
        );
      }

      if (message.type === 'read_receipt' && message.data.match_id === matchId) {
        // Update read status of messages
        queryClient.setQueryData<ChatMessage[]>(
          ['matchMessages', matchId],
          (old = []) =>
            old.map((msg) =>
              message.data.message_ids.includes(msg.id) ? { ...msg, read: true } : msg
            )
        );
      }
    });

    return unsubscribe;
  }, [matchId, queryClient]);

  return useQuery({
    queryKey: ['matchMessages', matchId],
    queryFn: () => ApiService.getMatchMessages(matchId),
    staleTime: 0,
    refetchOnMount: true,
  });
};

export const useSendMessage = (matchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => ApiService.sendMessage(matchId, content),
    onMutate: async (content) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['matchMessages', matchId] });
      
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['matchMessages', matchId]);
      
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        match_id: matchId,
        sender_id: 'me',
        content,
        message_type: 'text',
        created_at: new Date().toISOString(),
        read: false,
      };

      queryClient.setQueryData<ChatMessage[]>(
        ['matchMessages', matchId],
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, content, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['matchMessages', matchId], context.previousMessages);
      }
    },
    onSuccess: (data) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<ChatMessage[]>(
        ['matchMessages', matchId],
        (old = []) => {
          const filtered = old.filter((msg) => !msg.id.startsWith('temp-'));
          return [...filtered, data];
        }
      );
    },
  });
};

export const useMarkMessagesAsRead = (matchId: string) => {
  const { updateMatchUnreadCount } = useMatchStore();

  return useMutation({
    mutationFn: () => ApiService.markMessagesAsRead(matchId),
    onSuccess: () => {
      updateMatchUnreadCount(matchId, 0);
    },
  });
};

export const useSendTypingIndicator = (matchId: string) => {
  return () => {
    WebSocketService.sendTypingIndicator(matchId);
  };
};
