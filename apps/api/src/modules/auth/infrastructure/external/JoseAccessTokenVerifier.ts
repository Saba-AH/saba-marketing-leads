import { Inject, Injectable } from '@nestjs/common';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  errors,
  type JWTPayload,
  jwtVerify,
} from 'jose';
import type {
  AccessTokenClaims,
  AccessTokenVerifierPort,
} from '../../application/ports/out/AccessTokenVerifierPort';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthConfig } from '../authConfig';

const AUDIENCE = 'authenticated';
const ASYMMETRIC_ALGORITHMS = ['ES256', 'RS256'];

/**
 * Verifica localmente los JWT de Supabase Auth, sin ir a GoTrue por petición.
 * Acepta las dos firmas que puede emitir un proyecto: las llaves asimétricas
 * (JWKS, cacheadas por `jose`) y el secreto HS256 legado, que convive con
 * ellas mientras se rota.
 */
@Injectable()
export class JoseAccessTokenVerifier implements AccessTokenVerifierPort {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly secret: Uint8Array | null;

  constructor(@Inject(AUTH_TOKENS.Config) private readonly config: AuthConfig) {
    this.jwks = createRemoteJWKSet(
      new URL(`${config.issuer}/.well-known/jwks.json`)
    );
    this.secret = config.jwtSecret
      ? new TextEncoder().encode(config.jwtSecret)
      : null;
  }

  async verify(token: string): Promise<AccessTokenClaims | null> {
    try {
      const payload = await this.verifyPayload(token);
      if (!payload) return null;
      const { sub, session_id: sessionId } = payload;
      if (typeof sub !== 'string' || typeof sessionId !== 'string') return null;
      return { userId: sub, sessionId };
    } catch (error: unknown) {
      // Un token malo es un 401; no poder bajar las llaves no lo es.
      if (
        error instanceof errors.JOSEError &&
        !(error instanceof errors.JWKSTimeout) &&
        !(error instanceof errors.JWKSInvalid)
      ) {
        return null;
      }
      throw error;
    }
  }

  private async verifyPayload(token: string): Promise<JWTPayload | null> {
    const options = { issuer: this.config.issuer, audience: AUDIENCE };
    const alg = algorithmOf(token);
    if (!alg) return null;
    if (alg === 'HS256') {
      if (!this.secret) return null;
      const { payload } = await jwtVerify(token, this.secret, {
        ...options,
        algorithms: ['HS256'],
      });
      return payload;
    }
    const { payload } = await jwtVerify(token, this.jwks, {
      ...options,
      algorithms: ASYMMETRIC_ALGORITHMS,
    });
    return payload;
  }
}

function algorithmOf(token: string): string | null {
  try {
    return decodeProtectedHeader(token).alg ?? null;
  } catch {
    // Ni siquiera tiene forma de JWT.
    return null;
  }
}
