import type { TSessionUser } from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Port: what this feature needs from the API (through the BFF proxy). */
export interface AuthApi {
  me(): Promise<Safe<TSessionUser>>;
}
