import { queryOptions, useQuery } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from './useConversations.query';

/** Saba data rarely changes: no polling, it is fetched when the chat opens. */
const VALIDITY_MS = 5 * 60_000;

export function sabaCustomerQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: [
      ...chatsQueryKeys.all(),
      'sabaCustomer',
      conversationId,
    ] as const,
    queryFn: () => ChatsService.getSabaCustomer(conversationId),
    staleTime: VALIDITY_MS,
    retry: 1,
  });
}

export function useSabaCustomer(conversationId: string) {
  return useQuery(sabaCustomerQueryOptions(conversationId));
}
