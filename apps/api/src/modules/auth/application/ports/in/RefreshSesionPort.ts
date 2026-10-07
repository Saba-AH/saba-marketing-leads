import type { AuthSession } from '../../../domain/AuthSession';

export interface RefreshSesionPort {
  execute(refreshToken: string): Promise<AuthSession>;
}
