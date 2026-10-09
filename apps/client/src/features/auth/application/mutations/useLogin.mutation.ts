import type { TLogin } from '@repo/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionService } from '../../infrastructure';
import { sessionQueryKeys } from '../queries/useSessionUser.query';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TLogin) => SessionService.login(data),
    onSuccess: (user) => {
      // Whatever was left in the cache belonged to another session (or none).
      queryClient.clear();
      queryClient.setQueryData(sessionQueryKeys.user(), user);
    },
  });
}
