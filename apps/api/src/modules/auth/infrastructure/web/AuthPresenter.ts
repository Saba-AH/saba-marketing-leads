import type {
  TLoginResponse,
  TMeResponse,
  TRefreshSesionResponse,
  TSesionTokens,
} from '@repo/schemas';
import type { LoginResult } from '../../application/ports/in/LoginPort';
import type { AuthenticatedUser, AuthSession } from '../../domain/AuthSession';

function toSesionTokens(session: AuthSession): TSesionTokens {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

export function toLoginResponse(result: LoginResult): TLoginResponse {
  return {
    success: true,
    data: { sesion: toSesionTokens(result.sesion), usuario: result.usuario },
  };
}

export function toRefreshSesionResponse(
  session: AuthSession
): TRefreshSesionResponse {
  return { success: true, data: toSesionTokens(session) };
}

export function toMeResponse(user: AuthenticatedUser): TMeResponse {
  return { success: true, data: user };
}
