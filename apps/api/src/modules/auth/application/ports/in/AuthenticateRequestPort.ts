import type { AuthenticatedUser } from '../../../domain/AuthSession';

export interface AuthenticateRequestPort {
  execute(accessToken: string): Promise<AuthenticatedUser>;
}
