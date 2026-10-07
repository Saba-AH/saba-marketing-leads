import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionService } from '../../infrastructure';

export function useCerrarSesion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => SessionService.cerrarSesion(),
    onSettled: () => {
      // Aunque la API no responda, las cookies ya se borraron: nada de la
      // sesión anterior puede quedar visible.
      queryClient.clear();
    },
  });
}
