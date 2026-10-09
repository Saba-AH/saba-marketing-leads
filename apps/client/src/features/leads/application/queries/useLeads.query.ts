import { queryOptions, useQuery } from '@tanstack/react-query';
import { LeadsService } from '../../infrastructure';

export const leadsQueryKeys = {
  all: () => ['leads'] as const,
};

export function leadsQueryOptions() {
  return queryOptions({
    queryKey: leadsQueryKeys.all(),
    queryFn: () => LeadsService.list(),
  });
}

export function useLeads() {
  return useQuery(leadsQueryOptions());
}
