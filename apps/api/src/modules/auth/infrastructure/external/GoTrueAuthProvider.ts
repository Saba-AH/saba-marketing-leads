import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { AuthProviderPort } from '../../application/ports/out/AuthProviderPort';
import type { AuthSession } from '../../domain/AuthSession';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthConfig } from '../authConfig';

/** GoTrue describes its errors with a stable code; it never includes credentials. */
const errorResponseSchema = z.object({ error_code: z.string() }).partial();

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number().int(),
  user: z.object({ id: z.string() }),
});

/** GoTrue answers 400 to credentials or refresh tokens that are not valid. */
const REJECTED = 400;
/** When revoking, an already invalid token is not an error: the outcome is the same. */
const ALREADY_GONE = new Set([401, 403, 404]);
const TIMEOUT_MS = 10_000;

/**
 * Supabase Auth through its HTTP API, with the publishable key: login, refresh
 * and logout do not need the service key, so the API does not have it.
 */
@Injectable()
export class GoTrueAuthProvider implements AuthProviderPort {
  constructor(
    @Inject(AUTH_TOKENS.Config) private readonly config: AuthConfig
  ) {}

  async signIn(email: string, password: string): Promise<AuthSession | null> {
    return this.token('password', { email: email, password: password });
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
