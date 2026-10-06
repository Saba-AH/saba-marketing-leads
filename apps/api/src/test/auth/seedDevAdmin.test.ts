import { assertLocalDatabase } from '../../modules/auth/infrastructure/persistence/seedDevAdmin';

describe('assertLocalDatabase', () => {
  it.each([
    'postgresql://postgres:postgres@localhost:54332/postgres',
    'postgresql://postgres:postgres@127.0.0.1:54332/postgres',
  ])('deja sembrar en %s', (url) => {
    expect(() => assertLocalDatabase(url)).not.toThrow();
  });

  it('se niega a sembrar el admin de desarrollo en Supabase', () => {
    expect(() =>
      assertLocalDatabase(
        'postgresql://postgres.ref:secreto@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
      )
    ).toThrow(/solo se siembra en una base local/);
  });
});
