import type {
  TLoginResponse,
  TMeResponse,
  TRefreshSessionResponse,
  TSessionTokens,
} from '@repo/schemas';
import type { LoginResult } from '../../application/ports/in/LoginPort';
import type { AuthenticatedUser, AuthSession } from '../../domain/AuthSession';

function toSessionTokens(session: AuthSession): TSessionTokens {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

export function toLoginResponse(result: LoginResult): TLoginResponse {
  return {
    success: true,
    data: { session: toSessionTokens(result.session), user: result.user },
  };
}

export function toRefreshSessionResponse(
  session: AuthSession
): TRefreshSessionResponse {
  return { success: true, data: toSessionTokens(session) };
}

export function toMeResponse(user: AuthenticatedUser): TMeResponse {
  return { success: true, data: user };
}
