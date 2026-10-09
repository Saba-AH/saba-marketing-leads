import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionService } from '../../infrastructure';

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => SessionService.logout(),
    onSettled: () => {
      // Even if the API does not respond, the cookies are already gone: nothing
      // from the previous session may stay visible.
      queryClient.clear();
    },
  });
}
