import type { SabaAuthGatewayPort } from '../../modules/auth/application/ports/out/SabaAuthGatewayPort';
import type {
  AuthenticatedUser,
  AuthSession,
} from '../../modules/auth/domain/AuthSession';
import { InvalidSessionException } from '../../modules/auth/domain/exceptions/InvalidSessionException';

export function agent(
  overrides: Partial<AuthenticatedUser> = {}
): AuthenticatedUser {
  return {
    id: 'u-1',
    email: 'agente@sabatransporte.com',
    name: 'Angel Hernández',
    role: 'admin',
    permissions: ['marketing:access'],
    ...overrides,
  };
}

export function session(userId = 'u-1'): AuthSession {
  return {
    userId,
    accessToken: `access-${userId}`,
    refreshToken: `refresh-${userId}`,
    expiresAt: 1_791_400_000,
  };
}

/** In-memory Saba: one live session per access token. */
export class FakeSabaAuthGateway implements SabaAuthGatewayPort {
  readonly sessions = new Map<string, AuthenticatedUser>();
  readonly loggedOut: string[] = [];
  sessionLookups = 0;

  async login(): Promise<{ session: AuthSession; user: AuthenticatedUser }> {
    return { session: session(), user: agent() };
  }

  async refresh(refreshToken: string): Promise<AuthSession | null> {
    return refreshToken === 'refresh-u-1' ? session() : null;
  }

  async logout(accessToken: string): Promise<void> {
    this.loggedOut.push(accessToken);
    this.sessions.delete(accessToken);
  }

  async findSessionUser(accessToken: string): Promise<AuthenticatedUser> {
    this.sessionLookups += 1;
    const user = this.sessions.get(accessToken);
    if (!user) throw new InvalidSessionException();
    return user;
  }
}
