import { z } from 'zod';

const sabaEnvSchema = z.object({
  SABA_API_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.url().optional()
  ),
});

export interface SabaConfig {
  /** Base URL of Saba's Node server, without `/api` (e.g. `http://localhost:3001`). */
  apiUrl: string | null;
}

/** Optional: without it the API starts and the customer panel says Saba is unavailable. */
export function loadSabaConfig(
  env: NodeJS.ProcessEnv = process.env
): SabaConfig {
  const parsed = sabaEnvSchema.parse(env);
  return { apiUrl: parsed.SABA_API_URL?.replace(/\/+$/, '') ?? null };
}
