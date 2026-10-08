import { queryOptions, useQuery } from '@tanstack/react-query';
import { SessionService } from '../../infrastructure';

export const sessionQueryKeys = {
  user: () => ['session', 'user'] as const,
};

export function sessionUserQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKeys.user(),
    queryFn: () => SessionService.currentUser(),
    // Only changes with login/logout, which clear the cache.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useSessionUser() {
  return useQuery(sessionUserQueryOptions());
}
