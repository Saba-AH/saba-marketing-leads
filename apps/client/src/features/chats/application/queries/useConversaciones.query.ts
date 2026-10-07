import { queryOptions, useQuery } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';

/** Sin push en tiempo real (fase 1): la lista se refresca sola. */
const REFRESCO_LISTA_MS = 10_000;

export const chatsQueryKeys = {
  all: () => ['chats'] as const,
  conversaciones: () => [...chatsQueryKeys.all(), 'conversaciones'] as const,
  mensajes: (conversationId: string) =>
    [...chatsQueryKeys.all(), 'mensajes', conversationId] as const,
};

export function conversacionesQueryOptions() {
  return queryOptions({
    queryKey: chatsQueryKeys.conversaciones(),
    queryFn: () => ChatsService.listarConversaciones(),
    refetchInterval: REFRESCO_LISTA_MS,
  });
}

export function useConversaciones() {
  return useQuery(conversacionesQueryOptions());
}
