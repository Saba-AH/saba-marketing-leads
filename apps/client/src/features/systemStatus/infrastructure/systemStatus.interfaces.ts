import type { THealth } from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Puerto: lo único que esta feature necesita de la API. */
export interface HealthApi {
  check(): Promise<Safe<THealth>>;
}
