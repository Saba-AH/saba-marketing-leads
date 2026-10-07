import {
  type TLogin,
  type TUsuarioSesion,
  usuarioSesionSchema,
} from '@repo/schemas';
import { z } from 'zod';
import { LoginError } from '../domain/loginError';
import type { UsuarioSesion } from '../domain/usuarioSesion.model';
import type { AuthApi } from './auth.interfaces';
import { toUsuarioSesion } from './auth.transform';

/** Respuesta de `POST /api/session/login` (el BFF): el usuario, sin tokens. */
const loginBffResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.object({ usuario: usuarioSesionSchema }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
  }),
]);

const ERROR_GENERICO = 'No se pudo iniciar sesión. Intenta de nuevo.';

/**
 * Sesión del panel. Login y logout van al BFF (`/api/session/*`), que es el
 * único que ve los tokens; `me` va a la API por el proxy.
 */
export class SessionServiceClass {
  constructor(private readonly authApi: AuthApi) {}

  async iniciarSesion(datos: TLogin): Promise<UsuarioSesion> {
    const respuesta = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    }).catch(() => null);
    const cuerpo = loginBffResponseSchema.safeParse(
      await respuesta?.json().catch(() => null)
    );
    if (!cuerpo.success) throw new LoginError(ERROR_GENERICO);
    if (!cuerpo.data.success) {
      throw new LoginError(cuerpo.data.error, cuerpo.data.code);
    }
    return toUsuarioSesion(cuerpo.data.data.usuario);
  }

  async cerrarSesion(): Promise<void> {
    await fetch('/api/session/logout', { method: 'POST' });
  }

  async usuarioActual(): Promise<UsuarioSesion> {
    const result = await this.authApi.me();
    if (!result.success) throw new Error(result.error);
    return toUsuarioSesion(result.data satisfies TUsuarioSesion);
  }
}
