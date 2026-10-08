import { describe, expect, it } from 'vitest';
import { loadAuthConfig } from '../../modules/auth/infrastructure/authConfig';

const COMPLETE = {
  SUPABASE_URL: 'https://ref.supabase.co/',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
  SUPABASE_JWT_SECRET: 'secreto-legado',
  TURNSTILE_SECRET_KEY: 'turnstile',
};

describe('loadAuthConfig', () => {
  it('builds the JWT issuer from the project URL', () => {
    const config = loadAuthConfig(COMPLETE);

    expect(config.supabaseUrl).toBe('https://ref.supabase.co');
    expect(config.issuer).toBe('https://ref.supabase.co/auth/v1');
    expect(config.jwtSecret).toBe('secreto-legado');
  });

  // `.env` ships the blocks for both databases with the Supabase ones blank.
  it('treats an empty JWT secret as undefined', () => {
    expect(
      loadAuthConfig({ ...COMPLETE, SUPABASE_JWT_SECRET: '' }).jwtSecret
    ).toBeNull();
  });

  it('fails at startup if the required ones are blank', () => {
    expect(() =>
      loadAuthConfig({
        ...COMPLETE,
        SUPABASE_URL: '',
        SUPABASE_PUBLISHABLE_KEY: '',
      })
    ).toThrow(/SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY/);
  });
});
