import type { TCrearLead } from '@repo/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsService } from '../../infrastructure';
import { leadsQueryKeys } from '../queries/useLeads.query';

export function useCrearLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: TCrearLead) => LeadsService.crear(datos),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all() });
    },
  });
}
