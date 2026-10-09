import { queryOptions, useQuery } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from './useConversations.query';

/** The open thread refreshes more often than the list. */
const THREAD_REFRESH_MS = 3_000;

export function messagesQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: chatsQueryKeys.messages(conversationId),
    queryFn: () => ChatsService.listMessages(conversationId),
    refetchInterval: THREAD_REFRESH_MS,
  });
}

export function useMessages(conversationId: string) {
  return useQuery(messagesQueryOptions(conversationId));
}
