import type { TUsuarioSesion } from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Puerto: lo que esta feature necesita de la API (vía el proxy del BFF). */
export interface AuthApi {
  me(): Promise<Safe<TUsuarioSesion>>;
}
