import type { TStaffRole } from '@repo/schemas';

/** Tokens que emite Supabase Auth para una sesión. */
export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** Segundos desde epoch, como el `exp` del JWT. */
  expiresAt: number;
}

/** Lo que el guard deja en la petición una vez validada la sesión. */
export interface AuthenticatedUser {
  id: string;
  correo: string;
  nombre: string;
  rol: TStaffRole;
}
