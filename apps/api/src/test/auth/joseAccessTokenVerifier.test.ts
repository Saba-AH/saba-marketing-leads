import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { loadAuthConfig } from '../../modules/auth/infrastructure/authConfig';
import { JoseAccessTokenVerifier } from '../../modules/auth/infrastructure/external/JoseAccessTokenVerifier';
import { LOCAL_SUPABASE } from '../support/localSupabase';

const config = loadAuthConfig({
  SUPABASE_URL: LOCAL_SUPABASE.url,
  SUPABASE_PUBLISHABLE_KEY: LOCAL_SUPABASE.publishableKey,
  SUPABASE_JWT_SECRET: LOCAL_SUPABASE.jwtSecret,
  TURNSTILE_SECRET_KEY: 'x',
});
const verifier = new JoseAccessTokenVerifier(config);

interface TokenOptions {
  secret?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: string;
  sessionId?: string | null;
}

async function token(options: TokenOptions = {}): Promise<string> {
  const claims =
    options.sessionId === null
      ? {}
      : { session_id: options.sessionId ?? 's-1' };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('u-1')
    .setIssuer(options.issuer ?? config.issuer)
    .setAudience(options.audience ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? '1h')
    .sign(new TextEncoder().encode(options.secret ?? LOCAL_SUPABASE.jwtSecret));
}

describe('JoseAccessTokenVerifier', () => {
  it('accepts a well-signed Supabase Auth token', async () => {
    expect(await verifier.verify(await token())).toEqual({
      userId: 'u-1',
      sessionId: 's-1',
    });
  });

  it.each<[string, TokenOptions]>([
    [
      'signed with another secret',
      { secret: 'another-secret-of-at-least-32-chars!!' },
    ],
    ['from another project', { issuer: 'https://other.supabase.co/auth/v1' }],
    ['from a role that is not a user', { audience: 'anon' }],
    ['vencido', { expiresIn: '-1m' }],
    ['without a session', { sessionId: null }],
  ])('rejects a token %s', async (_case, options) => {
    expect(await verifier.verify(await token(options))).toBeNull();
  });

  it('rejects something that is not even a JWT', async () => {
    expect(await verifier.verify('no-es-un-jwt')).toBeNull();
  });

  it('rejects HS256 if the project has no legacy secret configured', async () => {
    const jwksOnly = new JoseAccessTokenVerifier({
      ...config,
      jwtSecret: null,
    });
    expect(await jwksOnly.verify(await token())).toBeNull();
  });
});
