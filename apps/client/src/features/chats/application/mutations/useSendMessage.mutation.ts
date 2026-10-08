import type { TSendMessage } from '@repo/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatsService } from '../../infrastructure';
import { chatsQueryKeys } from '../queries/useConversations.query';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TSendMessage) =>
      ChatsService.sendMessage(conversationId, data),
    // Also on failure: the message stays saved as failed and must be visible.
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: chatsQueryKeys.all() });
    },
  });
}
