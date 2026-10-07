import type { AuthSession } from '../../../domain/AuthSession';

/** Supabase Auth: dueño de las contraseñas y de las sesiones. */
export interface AuthProviderPort {
  /** `null` si las credenciales no son válidas. */
  signIn(correo: string, contrasena: string): Promise<AuthSession | null>;
  /** `null` si el refresh token ya no sirve (usado, revocado o vencido). */
  refresh(refreshToken: string): Promise<AuthSession | null>;
  /** Cierra la sesión del token. Idempotente: un token ya inválido no falla. */
  revoke(accessToken: string): Promise<void>;
}
