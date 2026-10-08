/**
 * Defaults of the local Supabase CLI stack (`npm run db:up`). They are public
 * and fixed in the CLI —not secrets of any real environment—, so tests can take
 * them for granted without reading `supabase status`.
 */
export const LOCAL_SUPABASE = {
  url: 'http://127.0.0.1:54331',
  publishableKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  jwtSecret: 'super-secret-jwt-token-with-at-least-32-characters-long',
} as const;

/** Turnstile test secret key that always validates (Cloudflare docs). */
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

export function useLocalAuthEnv(): void {
  process.env.SUPABASE_URL = LOCAL_SUPABASE.url;
  process.env.SUPABASE_PUBLISHABLE_KEY = LOCAL_SUPABASE.publishableKey;
  process.env.SUPABASE_JWT_SECRET = LOCAL_SUPABASE.jwtSecret;
  process.env.TURNSTILE_SECRET_KEY = TURNSTILE_TEST_SECRET;
}
