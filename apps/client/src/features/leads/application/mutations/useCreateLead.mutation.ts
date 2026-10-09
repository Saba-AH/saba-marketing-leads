import type { TCreateLead } from '@repo/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsService } from '../../infrastructure';
import { leadsQueryKeys } from '../queries/useLeads.query';

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TCreateLead) => LeadsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all() });
    },
  });
}
