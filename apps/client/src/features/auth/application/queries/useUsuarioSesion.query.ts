import { queryOptions, useQuery } from '@tanstack/react-query';
import { SessionService } from '../../infrastructure';

export const sesionQueryKeys = {
  usuario: () => ['sesion', 'usuario'] as const,
};

export function usuarioSesionQueryOptions() {
  return queryOptions({
    queryKey: sesionQueryKeys.usuario(),
    queryFn: () => SessionService.usuarioActual(),
    // Cambia solo con login/logout, que limpian la caché.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useUsuarioSesion() {
  return useQuery(usuarioSesionQueryOptions());
}
