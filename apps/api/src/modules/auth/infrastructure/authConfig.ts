import { z } from 'zod';

/** `VAR=` in `.env` counts as undefined: `.env` ships blank whatever is unused. */
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional()
  );
}

const authEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  /** Only if the project still signs with the legacy HS256 secret. */
  SUPABASE_JWT_SECRET: optional(z.string()),
  TURNSTILE_SECRET_KEY: z.string().min(1),
});

export interface AuthConfig {
  supabaseUrl: string;
  /** `iss` of Supabase Auth JWTs. */
  issuer: string;
  publishableKey: string;
  jwtSecret: string | null;
  turnstileSecretKey: string;
}

/**
 * Fails at startup if anything is missing: an API that starts without being
 * able to validate sessions would answer 401 to everything and the reason
 * would end up buried in a log.
 */
export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env
): AuthConfig {
  const parsed = authEnvSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.'));
    throw new Error(
      `configuración de auth incompleta o inválida: ${missing.join(', ')}. ` +
        'Con el Supabase local, arrancar con `npm run dev` (las toma de ' +
        '`supabase status`); para el Supabase real, definirlas en apps/api/.env.'
    );
  }
  const supabaseUrl = parsed.data.SUPABASE_URL.replace(/\/+$/, '');
  return {
    supabaseUrl,
    issuer: `${supabaseUrl}/auth/v1`,
    publishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
    jwtSecret: parsed.data.SUPABASE_JWT_SECRET ?? null,
    turnstileSecretKey: parsed.data.TURNSTILE_SECRET_KEY,
  };
}
