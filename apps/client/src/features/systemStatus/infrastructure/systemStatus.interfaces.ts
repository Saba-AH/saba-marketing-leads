import type { THealth } from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Port: the only thing this feature needs from the API. */
export interface HealthApi {
  check(): Promise<Safe<THealth>>;
}
