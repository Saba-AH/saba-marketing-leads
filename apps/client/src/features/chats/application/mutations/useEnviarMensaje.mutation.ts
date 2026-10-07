import type { TEnviarMensaje } from '@repo/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from '../queries/useConversaciones.query';

export function useEnviarMensaje(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: TEnviarMensaje) =>
      ChatsService.enviarMensaje(conversationId, datos),
    // También si falla: el mensaje queda guardado como fallido y debe verse.
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: chatsQueryKeys.all() });
    },
  });
}
