import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from '../queries/useConversations.query';

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      ChatsService.markAsRead(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: chatsQueryKeys.conversations(),
      });
    },
  });
}
