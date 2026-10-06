import { queryOptions, useQuery } from '@tanstack/react-query';
import { SYSTEM_STATUS_REFETCH_INTERVAL_MS } from '../../domain/systemStatus.constants';
import { SystemStatusService } from '../../infrastructure';

export const systemStatusQueryKeys = {
  all: () => ['systemStatus'] as const,
};

export function systemStatusQueryOptions() {
  return queryOptions({
    queryKey: systemStatusQueryKeys.all(),
    queryFn: () => SystemStatusService.getStatus(),
    refetchInterval: SYSTEM_STATUS_REFETCH_INTERVAL_MS,
    retry: false,
  });
}

export function useSystemStatus() {
  return useQuery(systemStatusQueryOptions());
}
