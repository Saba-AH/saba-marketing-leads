import { z } from 'zod';

/**
 * Saba's server is the only way to its data (login, sessions, customers): this
 * API never touches Saba's database. Every `/api/marketing/*` call carries the
 * service key; the ones made on behalf of an agent also carry their token.
 */

const sabaEnvSchema = z.object({
  SABA_API_URL: z.url(),
  SABA_SERVICE_KEY: z.string().min(1),
});

export interface SabaApiConfig {
  /** Base URL of Saba's Node server, without `/api` (e.g. `http://localhost:3001`). */
  apiUrl: string;
  /** Same value as Saba's `MARKETING_SERVICE_KEY`. */
  serviceKey: string;
}

/** Who the agent is, so Saba's login rate limit counts per agent and not per API server. */
export interface ClientInfo {
  ip: string | null;
  userAgent: string | null;
}

export const SABA_TIMEOUT_MS = 8_000;

/** Saba's answer to a wrong service key: a misconfiguration, not an expired session. */
export const INVALID_SERVICE_KEY_CODE = 'invalid_service_key';

const errorBodySchema = z.object({ code: z.string() }).partial();

/**
 * Fails at startup: without Saba there is no login, and an API that starts
 * anyway answers 401 to everything with the reason buried in a log.
 */
export function loadSabaApiConfig(
  env: NodeJS.ProcessEnv = process.env
): SabaApiConfig {
  const parsed = sabaEnvSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.'));
    throw new Error(
      `configuración de Saba incompleta o inválida: ${missing.join(', ')}. ` +
        'Definirlas en apps/api/.env (SABA_SERVICE_KEY = MARKETING_SERVICE_KEY de Saba).'
    );
  }
  return {
    apiUrl: parsed.data.SABA_API_URL.replace(/\/+$/, ''),
    serviceKey: parsed.data.SABA_SERVICE_KEY,
  };
}

export function sabaUrl(config: SabaApiConfig, path: string): URL {
  return new URL(`${config.apiUrl}/api/marketing${path}`);
}

export function sabaHeaders(
  config: SabaApiConfig,
  options: { accessToken?: string; client?: ClientInfo } = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Saba-Service-Key': config.serviceKey,
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (options.client?.ip) headers['X-Marketing-Client-Ip'] = options.client.ip;
  if (options.client?.userAgent) {
    headers['X-Marketing-User-Agent'] = options.client.userAgent;
  }
  return headers;
}

/** The `code` of an error answer from Saba, if it sent one. */
export async function sabaErrorCode(
  response: Response
): Promise<string | undefined> {
  const body = errorBodySchema.safeParse(
    await response.json().catch(() => null)
  );
  return body.success ? body.data.code : undefined;
}
