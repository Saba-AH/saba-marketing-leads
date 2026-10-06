import type { TLogin } from '@repo/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionService } from '../../infrastructure';
import { sesionQueryKeys } from '../queries/useUsuarioSesion.query';

export function useIniciarSesion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: TLogin) => SessionService.iniciarSesion(datos),
    onSuccess: (usuario) => {
      // Lo que quedara en caché era de otra sesión (o de ninguna).
      queryClient.clear();
      queryClient.setQueryData(sesionQueryKeys.usuario(), usuario);
    },
  });
}
