import { queryOptions, useQuery } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from './useConversaciones.query';

/** El hilo abierto se refresca más seguido que la lista. */
const REFRESCO_HILO_MS = 3_000;

export function mensajesQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: chatsQueryKeys.mensajes(conversationId),
    queryFn: () => ChatsService.listarMensajes(conversationId),
    refetchInterval: REFRESCO_HILO_MS,
  });
}

export function useMensajes(conversationId: string) {
  return useQuery(mensajesQueryOptions(conversationId));
}
