import { z } from 'zod';

const authEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: z.string().min(1),
});

export interface AuthConfig {
  turnstileSecretKey: string;
}

/** Fails at startup: without it no login can pass the CAPTCHA. */
export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env
): AuthConfig {
  const parsed = authEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      'configuración de auth incompleta: TURNSTILE_SECRET_KEY. Definirla en apps/api/.env.'
    );
  }
  return { turnstileSecretKey: parsed.data.TURNSTILE_SECRET_KEY };
}
