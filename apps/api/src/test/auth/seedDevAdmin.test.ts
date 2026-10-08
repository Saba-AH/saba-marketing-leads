import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertLocalDatabase } from '../../infrastructure/database/databaseUrl';
import { testBaseDatabaseUrl } from '../../infrastructure/database/migrator';
import {
  DEV_ADMIN,
  seedDevAdmin,
} from '../../modules/auth/infrastructure/persistence/seedDevAdmin';

describe('assertLocalDatabase', () => {
  it.each([
    'postgresql://postgres:postgres@localhost:54332/postgres',
    'postgresql://postgres:postgres@127.0.0.1:54332/postgres',
  ])('allows seeding into %s', (url) => {
    expect(() => assertLocalDatabase(url, 'el seed')).not.toThrow();
  });

  it('refuses to seed the development admin into Supabase', () => {
    expect(() =>
      assertLocalDatabase(
        'postgresql://postgres.ref:secreto@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
        'el seed'
      )
    ).toThrow('el seed solo escribe en una base local');
  });
});

describe('seedDevAdmin', () => {
  const DATABASE = 'app_seed_test';
  let pool: Pool;

  function urlFor(database: string): string {
    const url = new URL(testBaseDatabaseUrl());
    url.pathname = `/${database}`;
    return url.toString();
  }

  beforeAll(async () => {
    const admin = new Pool({ connectionString: urlFor('postgres') });
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${DATABASE}" WITH (FORCE)`);
      await admin.query(`CREATE DATABASE "${DATABASE}"`);
    } finally {
      await admin.end();
    }
    pool = new Pool({ connectionString: urlFor(DATABASE) });
    await pool.query(`
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
      CREATE TABLE public.profiles (id uuid PRIMARY KEY, email text, nombre text, apellido text, role text);
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  // After `npm run db:sync:saba` the email belongs to the prod user.
  it('does not create the development admin if its email already belongs to another user', async () => {
    const fromProd = '00000000-0000-0000-0000-00000000000a';
    await pool.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [
      fromProd,
      DEV_ADMIN.email,
    ]);

    const seeded = await seedDevAdmin(drizzle(pool));

    expect(seeded).toBe(false);
    const { rows } = await pool.query('SELECT id FROM auth.users');
    expect(rows).toEqual([{ id: fromProd }]);
    const profiles = await pool.query('SELECT * FROM public.profiles');
    expect(profiles.rowCount).toBe(0);
  });
});
