import { queryOptions, useQuery } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from './useConversaciones.query';

/** Los datos de Saba cambian poco: sin polling, se piden al abrir el chat. */
const VIGENCIA_MS = 5 * 60_000;

export function clienteSabaQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: [...chatsQueryKeys.all(), 'clienteSaba', conversationId] as const,
    queryFn: () => ChatsService.obtenerClienteSaba(conversationId),
    staleTime: VIGENCIA_MS,
    retry: 1,
  });
}

export function useClienteSaba(conversationId: string) {
  return useQuery(clienteSabaQueryOptions(conversationId));
}
