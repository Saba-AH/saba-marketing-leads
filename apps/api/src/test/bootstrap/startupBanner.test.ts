import { describe, expect, it } from 'vitest';
import { startupBanner } from '../../infrastructure/bootstrap/startupBanner';

const BASE = {
  port: 8080,
  dbTarget: 'local' as const,
  explicitDatabase: false,
  panelUrl: 'http://localhost:3002',
  studioUrl: 'http://127.0.0.1:54333',
};

describe('startupBanner', () => {
  it('en local dice LOCAL y lista lo que se puede abrir, Studio incluido', () => {
    const banner = startupBanner({
      ...BASE,
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54332/postgres',
    });

    expect(banner).toContain('LOCAL');
    expect(banner).toContain('Panel:    http://localhost:3002');
    expect(banner).toContain('API:      http://localhost:8080/api/v1');
    expect(banner).toContain('Swagger:  http://localhost:8080/api/docs');
    expect(banner).toContain('Studio:   http://127.0.0.1:54333');
    expect(banner).toContain('postgresql://***@127.0.0.1:54332/postgres');
    expect(banner).not.toContain('postgres:postgres');
  });

  it('contra Supabase avisa que son datos reales y no muestra el Studio local', () => {
    const banner = startupBanner({
      ...BASE,
      dbTarget: 'supabase',
      databaseUrl:
        'postgresql://postgres.ref:secreto@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
    });

    expect(banner).toContain('SUPABASE');
    expect(banner).toContain('datos reales');
    expect(banner).not.toContain('Studio');
    expect(banner).not.toContain('secreto');
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
