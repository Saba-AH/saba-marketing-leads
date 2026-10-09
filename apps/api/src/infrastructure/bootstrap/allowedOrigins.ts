/**
 * CORS allowed origins. The first one is the panel: the startup banner shows
 * it as the link to open.
 */
export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
