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
  it('acepta un token de Supabase Auth bien firmado', async () => {
    expect(await verifier.verify(await token())).toEqual({
      userId: 'u-1',
      sessionId: 's-1',
    });
  });

  it.each<[string, TokenOptions]>([
    [
      'firmado con otro secreto',
      { secret: 'otro-secreto-de-al-menos-32-caracteres!!' },
    ],
    ['de otro proyecto', { issuer: 'https://otro.supabase.co/auth/v1' }],
    ['de un rol que no es usuario', { audience: 'anon' }],
    ['vencido', { expiresIn: '-1m' }],
    ['sin sesión', { sessionId: null }],
  ])('rechaza un token %s', async (_caso, options) => {
    expect(await verifier.verify(await token(options))).toBeNull();
  });

  it('rechaza algo que ni siquiera es un JWT', async () => {
    expect(await verifier.verify('no-es-un-jwt')).toBeNull();
  });

  it('rechaza HS256 si el proyecto no tiene secreto legado configurado', async () => {
    const soloJwks = new JoseAccessTokenVerifier({
      ...config,
      jwtSecret: null,
    });
    expect(await soloJwks.verify(await token())).toBeNull();
  });
});
