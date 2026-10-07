/**
 * Valores por defecto del stack local de Supabase CLI (`npm run db:up`). Son
 * públicos y fijos en el CLI —no son secretos de ningún entorno real—, así que
 * los tests pueden darlos por sentados sin leer `supabase status`.
 */
export const LOCAL_SUPABASE = {
  url: 'http://127.0.0.1:54331',
  publishableKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  jwtSecret: 'super-secret-jwt-token-with-at-least-32-characters-long',
} as const;

/** Llave secreta de prueba de Turnstile que siempre valida (docs de Cloudflare). */
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

export function useLocalAuthEnv(): void {
  process.env.SUPABASE_URL = LOCAL_SUPABASE.url;
  process.env.SUPABASE_PUBLISHABLE_KEY = LOCAL_SUPABASE.publishableKey;
  process.env.SUPABASE_JWT_SECRET = LOCAL_SUPABASE.jwtSecret;
  process.env.TURNSTILE_SECRET_KEY = TURNSTILE_TEST_SECRET;
}
