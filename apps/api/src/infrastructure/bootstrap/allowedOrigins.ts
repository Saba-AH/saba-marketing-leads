/**
 * Orígenes permitidos por CORS. El primero es el panel: el banner de arranque
 * lo muestra como el link a abrir.
 */
export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
