import type { AuthSession } from '../../../domain/AuthSession';

export interface RefreshSessionPort {
  execute(refreshToken: string): Promise<AuthSession>;
}
