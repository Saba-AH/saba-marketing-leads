import { describe, expect, it } from 'vitest';
import {
  shouldColor,
  startupBanner,
} from '../../infrastructure/bootstrap/startupBanner';

const LOCAL_DB = 'postgresql://postgres:postgres@127.0.0.1:54332/postgres';
const REMOTE_DB =
  'postgresql://postgres.ref:secreto@aws-0-us-east-2.pooler.supabase.com:5432/postgres';

const BASE = {
  port: 8080,
  dbTarget: 'local' as const,
  explicitDatabase: false,
  panelUrl: 'http://localhost:3002',
  studioUrl: 'http://127.0.0.1:54333',
  color: false,
};

describe('startupBanner', () => {
  it('en local dice LOCAL y lista lo que se puede abrir, Studio incluido', () => {
    const banner = startupBanner({ ...BASE, databaseUrl: LOCAL_DB });

    expect(banner).toContain('● LOCAL');
    expect(banner).toMatch(/│ Panel\s+http:\/\/localhost:3002\s+│/);
    expect(banner).toContain('http://localhost:8080/api/v1');
    expect(banner).toContain('http://localhost:8080/api/docs');
    expect(banner).toMatch(/│ Studio\s+http:\/\/127\.0\.0\.1:54333/);
    expect(banner).toContain('postgresql://***@127.0.0.1:54332/postgres');
    expect(banner).not.toContain('postgres:postgres');
  });

  it('contra Supabase avisa que son datos reales y no muestra el Studio local', () => {
    const banner = startupBanner({
      ...BASE,
      dbTarget: 'supabase',
      databaseUrl: REMOTE_DB,
    });

    expect(banner).toContain('▲ SUPABASE REMOTO');
    expect(banner).toContain('datos reales');
    expect(banner).not.toContain('Studio');
    expect(banner).not.toContain('secreto');
  });

  it('dibuja un recuadro parejo', () => {
    const lineas = startupBanner({ ...BASE, databaseUrl: LOCAL_DB })
      .split('\n')
      .filter((linea) => linea.trim());

    expect(lineas[0]?.trim()).toMatch(/^╭─ .*╮$/);
    expect(lineas.at(-1)?.trim()).toMatch(/^╰─+╯$/);
    expect(new Set(lineas.map((linea) => linea.length)).size).toBe(1);
  });

  it('muestra los avisos y sigue informando aunque la base no se pueda resolver', () => {
    const banner = startupBanner({
      ...BASE,
      dbTarget: 'supabase',
      databaseUrl: null,
      warnings: ['DATABASE_SUPABASE está vacía'],
    });

    expect(banner).toContain('▲ SUPABASE REMOTO');
    expect(banner).toContain('⚠ DATABASE_SUPABASE está vacía');
  });

  it('colorea verde en local y rojo contra Supabase', () => {
    const local = startupBanner({
      ...BASE,
      databaseUrl: LOCAL_DB,
      color: true,
    });
    const remoto = startupBanner({
      ...BASE,
      dbTarget: 'supabase',
      databaseUrl: REMOTE_DB,
      color: true,
    });

    expect(local).toContain('\u001b[32m');
    expect(remoto).toContain('\u001b[31m');
  });

  it('muestra contra qué Auth valida y, solo en local, el usuario de prueba', () => {
    const devLogin = { correo: 'admin@saba.com', contrasena: '12345678' };
    const local = startupBanner({
      ...BASE,
      databaseUrl: LOCAL_DB,
      authUrl: 'http://127.0.0.1:54331',
      devLogin,
    });
    const remoto = startupBanner({
      ...BASE,
      dbTarget: 'supabase',
      databaseUrl: REMOTE_DB,
      authUrl: 'https://ref.supabase.co',
      devLogin,
    });

    expect(local).toMatch(/│ Auth\s+http:\/\/127\.0\.0\.1:54331/);
    expect(local).toMatch(/│ Login\s+admin@saba\.com \/ 12345678 \(o la real/);
    expect(remoto).toMatch(/│ Auth\s+https:\/\/ref\.supabase\.co/);
    expect(remoto).not.toContain('12345678');
  });

  it('nombra el origen de la base cuando es una DATABASE explícita', () => {
    const banner = startupBanner({
      ...BASE,
      explicitDatabase: true,
      databaseUrl: 'postgresql://u:p@127.0.0.1:5432/x',
    });

    expect(banner).toContain('DATABASE explícita');
  });
});

describe('shouldColor', () => {
  it('no colorea en producción ni con NO_COLOR', () => {
    expect(shouldColor({ NODE_ENV: 'development' })).toBe(true);
    expect(shouldColor({ NODE_ENV: 'production' })).toBe(false);
    expect(shouldColor({ NO_COLOR: '1' })).toBe(false);
  });
});
