import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { AuthProviderPort } from '../../application/ports/out/AuthProviderPort';
import type { AuthSession } from '../../domain/AuthSession';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthConfig } from '../authConfig';

/** GoTrue describe sus errores con un código estable; nunca trae credenciales. */
const errorResponseSchema = z.object({ error_code: z.string() }).partial();

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number().int(),
  user: z.object({ id: z.string() }),
});

/** GoTrue responde 400 a credenciales o refresh tokens que no sirven. */
const REJECTED = 400;
/** Al revocar, un token ya inválido no es un error: el resultado es el mismo. */
const ALREADY_GONE = new Set([401, 403, 404]);
const TIMEOUT_MS = 10_000;

/**
 * Supabase Auth por su API HTTP, con la llave publicable: el login, el refresh
 * y el logout no necesitan la llave de servicio, así que la API no la tiene.
 */
@Injectable()
export class GoTrueAuthProvider implements AuthProviderPort {
  constructor(
    @Inject(AUTH_TOKENS.Config) private readonly config: AuthConfig
  ) {}

  async signIn(
    correo: string,
    contrasena: string
  ): Promise<AuthSession | null> {
    return this.token('password', { email: correo, password: contrasena });
  }

  async refresh(refreshToken: string): Promise<AuthSession | null> {
    return this.token('refresh_token', { refresh_token: refreshToken });
  }

  async revoke(accessToken: string): Promise<void> {
    const response = await this.request('/logout?scope=local', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok && !ALREADY_GONE.has(response.status)) {
      throw await unexpected('/logout', response);
    }
  }

  private async token(
    grantType: 'password' | 'refresh_token',
    body: Record<string, string>
  ): Promise<AuthSession | null> {
    const response = await this.request(`/token?grant_type=${grantType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status === REJECTED) return null;
    if (!response.ok) {
      throw await unexpected(`/token (${grantType})`, response);
    }
    const data = tokenResponseSchema.parse(await response.json());
    return {
      userId: data.user.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  }

  private request(path: string, init: RequestInit): Promise<Response> {
    return fetch(`${this.config.issuer}${path}`, {
      ...init,
      headers: { ...init.headers, apikey: this.config.publishableKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}

async function unexpected(path: string, response: Response): Promise<Error> {
  const body = errorResponseSchema.safeParse(
    await response.json().catch(() => ({}))
  );
  const code = body.success ? body.data.error_code : undefined;
  return new Error(
    `GoTrue ${path} respondió ${response.status}${code ? ` (${code})` : ''}`
  );
}
