import { z } from 'zod';

/** `VAR=` en el `.env` cuenta como no definida: el `.env` trae en blanco lo que no se usa. */
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional()
  );
}

const authEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  /** Solo si el proyecto todavía firma con el secreto HS256 legado. */
  SUPABASE_JWT_SECRET: optional(z.string()),
  TURNSTILE_SECRET_KEY: z.string().min(1),
});

export interface AuthConfig {
  supabaseUrl: string;
  /** `iss` de los JWT de Supabase Auth. */
  issuer: string;
  publishableKey: string;
  jwtSecret: string | null;
  turnstileSecretKey: string;
}

/**
 * Falla al arrancar si falta algo: una API que levanta sin poder validar
 * sesiones respondería 401 a todo y el motivo quedaría enterrado en un log.
 */
export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env
): AuthConfig {
  const parsed = authEnvSchema.safeParse(env);
  if (!parsed.success) {
    const faltantes = parsed.error.issues.map((i) => i.path.join('.'));
    throw new Error(
      `configuración de auth incompleta o inválida: ${faltantes.join(', ')}. ` +
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
