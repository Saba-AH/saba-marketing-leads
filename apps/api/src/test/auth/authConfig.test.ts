import { describe, expect, it } from 'vitest';
import { loadAuthConfig } from '../../modules/auth/infrastructure/authConfig';

const COMPLETA = {
  SUPABASE_URL: 'https://ref.supabase.co/',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
  SUPABASE_JWT_SECRET: 'secreto-legado',
  TURNSTILE_SECRET_KEY: 'turnstile',
};

describe('loadAuthConfig', () => {
  it('arma el emisor de los JWT desde la URL del proyecto', () => {
    const config = loadAuthConfig(COMPLETA);

    expect(config.supabaseUrl).toBe('https://ref.supabase.co');
    expect(config.issuer).toBe('https://ref.supabase.co/auth/v1');
    expect(config.jwtSecret).toBe('secreto-legado');
  });

  // El `.env` trae los bloques de las dos bases con los de Supabase en blanco.
  it('toma un secreto JWT vacío como no definido', () => {
    expect(
      loadAuthConfig({ ...COMPLETA, SUPABASE_JWT_SECRET: '' }).jwtSecret
    ).toBeNull();
  });

  it('falla al arrancar si las obligatorias están en blanco', () => {
    expect(() =>
      loadAuthConfig({
        ...COMPLETA,
        SUPABASE_URL: '',
        SUPABASE_PUBLISHABLE_KEY: '',
      })
    ).toThrow(/SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY/);
  });
});
