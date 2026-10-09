import type { ClientInfo } from '../../../../../infrastructure/saba/sabaApi';
import type {
  AuthenticatedUser,
  AuthSession,
} from '../../../domain/AuthSession';

export interface SabaLoginResult {
  session: AuthSession;
  user: AuthenticatedUser;
}

/**
 * Saba owns the staff login (rate limit, lockout, `login_attempts`), the
 * sessions and the marketing permissions. Saba's rejections arrive as domain
 * exceptions; `AuthUnavailableException` when Saba itself fails.
 */
export interface SabaAuthGatewayPort {
  login(
    email: string,
    password: string,
    client: ClientInfo
  ): Promise<SabaLoginResult>;
  /** `null` if the refresh token is no longer usable. */
  refresh(refreshToken: string): Promise<AuthSession | null>;
  /** Idempotent: an already closed session does not fail. */
  logout(accessToken: string): Promise<void>;
  /** Throws `InvalidSessionException` or `NoAccessException`. */
  findSessionUser(accessToken: string): Promise<AuthenticatedUser>;
}
