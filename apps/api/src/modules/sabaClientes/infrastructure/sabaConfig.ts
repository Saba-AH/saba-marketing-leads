import { z } from 'zod';

const sabaEnvSchema = z.object({
  SABA_API_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.url().optional()
  ),
});

export interface SabaConfig {
  /** Base del servidor Node de Saba, sin `/api` (p. ej. `http://localhost:3001`). */
  apiUrl: string | null;
}

/** Opcional: sin ella la API arranca y el panel del cliente avisa que Saba no está disponible. */
export function loadSabaConfig(
  env: NodeJS.ProcessEnv = process.env
): SabaConfig {
  const parsed = sabaEnvSchema.parse(env);
  return { apiUrl: parsed.SABA_API_URL?.replace(/\/+$/, '') ?? null };
}
