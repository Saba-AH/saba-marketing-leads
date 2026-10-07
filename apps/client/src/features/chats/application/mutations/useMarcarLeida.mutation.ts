import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from '../queries/useConversaciones.query';

export function useMarcarLeida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      ChatsService.marcarLeida(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: chatsQueryKeys.conversaciones(),
      });
    },
  });
}
