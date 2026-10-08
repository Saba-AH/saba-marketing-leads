import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { syncSaba } from '../../../scripts/sync/syncSaba';
import { testBaseDatabaseUrl } from '../../infrastructure/database/migrator';

/**
 * Copy between two local databases: `prod` plays Saba's Supabase and `local`
 * the target. The schema is minimal (only the columns the sync filters on or
 * the cases need) but mimics what matters from the real one: `auth` with
 * generated columns, FKs between tables and a plan table that does not exist
 * locally (`stores`).
 */
const SOURCE_DB = 'app_sync_prod_test';
const TARGET_DB = 'app_sync_local_test';

const ADMIN = 'angel.hernandez@sabatransporte.com';
const CUSTOMER = 'angel.hernandez+user-test@sabatransporte.com';
const USERS = { admins: [ADMIN], customers: [CUSTOMER] };

const ID = {
  admin: '00000000-0000-0000-0000-00000000000a',
  customer: '00000000-0000-0000-0000-00000000000c',
  other: '00000000-0000-0000-0000-0000000000ff',
  seed: 'de000000-0000-0000-0000-000000000001',
  app1: '00000000-0000-0000-0000-0000000000a1',
  otherApp: '00000000-0000-0000-0000-0000000000a9',
  payment1: '00000000-0000-0000-0000-0000000000b1',
  installment1: '00000000-0000-0000-0000-0000000000c1',
};

const SCHEMA = `
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (
    id uuid PRIMARY KEY,
    email text,
    encrypted_password text,
    email_confirmed_at timestamptz,
    confirmed_at timestamptz GENERATED ALWAYS AS (email_confirmed_at) STORED
  );
  CREATE TABLE auth.identities (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    provider_id text NOT NULL,
    identity_data jsonb NOT NULL,
    email text GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED
  );
  CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL);
  CREATE TABLE auth.refresh_tokens (id bigserial PRIMARY KEY, user_id varchar(255), session_id uuid);
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL,
    nombre text NOT NULL,
    role text
  );
  CREATE TABLE public.user_documents (id uuid PRIMARY KEY, user_id uuid REFERENCES public.profiles(id), url text);
  CREATE TABLE public.notifications (id uuid PRIMARY KEY, user_id uuid, texto text);
  CREATE TABLE public.applications (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id),
    status text,
    product_id uuid,
    metadata jsonb
  );
  CREATE TABLE public.application_documents (id uuid PRIMARY KEY, application_id uuid REFERENCES public.applications(id));
  CREATE TABLE public.application_rejection_reasons (id uuid PRIMARY KEY, application_id uuid);
  CREATE TABLE public.payments (id uuid PRIMARY KEY, application_id uuid REFERENCES public.applications(id), amount numeric);
  CREATE TABLE public.installments (id uuid PRIMARY KEY, application_id uuid, payment_id uuid, numero int);
  CREATE TABLE public.payments_installments (id uuid PRIMARY KEY, payment_id uuid, installment_id uuid);
  CREATE TABLE public.appointments (id uuid PRIMARY KEY, application_id uuid, user_id uuid);
  CREATE TABLE public.products (id uuid PRIMARY KEY, model text, account_id uuid);
  CREATE TABLE public.product_variant_attributes (id uuid PRIMARY KEY);
  CREATE TABLE public.product_variant_attribute_values (id uuid PRIMARY KEY);
  CREATE TABLE public.payment_interest_rules (id uuid PRIMARY KEY);
  CREATE TABLE public.providers (id uuid PRIMARY KEY);
  CREATE TABLE public.payment_methods (id uuid PRIMARY KEY);
`;

function urlFor(database: string): string {
  const url = new URL(testBaseDatabaseUrl());
  url.pathname = `/${database}`;
  return url.toString();
}

async function recreate(database: string): Promise<void> {
  const admin = new Pool({ connectionString: urlFor('postgres') });
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }
  const pool = new Pool({ connectionString: urlFor(database) });
  try {
    await pool.query(SCHEMA);
  } finally {
    await pool.end();
  }
}

let source: Pool;
let target: Pool;

async function seedProd(): Promise<void> {
  await source.query(
    `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at) VALUES
       ($1, $4, 'hash-admin', now()), ($2, $5, 'customer-hash', now()), ($3, 'otro@x.com', 'hash-otro', now())`,
    [ID.admin, ID.customer, ID.other, ADMIN, CUSTOMER]
  );
  await source.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, identity_data) VALUES
       ($1, $1, $3, jsonb_build_object('email', $3::text)), ($2, $2, $4, jsonb_build_object('email', $4::text))`,
    [ID.admin, ID.customer, ADMIN, CUSTOMER]
  );
  await source.query(
    `INSERT INTO public.profiles (id, email, nombre, role) VALUES
       ($1, $4, 'Angel', 'admin'), ($2, $5, 'Angel Test', 'standard'), ($3, 'otro@x.com', 'Otro', 'standard')`,
    [ID.admin, ID.customer, ID.other, ADMIN, CUSTOMER]
  );
  await source.query(
    `INSERT INTO public.applications (id, user_id, status, metadata) VALUES
       ($1, $2, 'aprobada', '{"canal":"web"}'), ($3, $4, 'pendiente', null)`,
    [ID.app1, ID.customer, ID.otherApp, ID.other]
  );
  await source.query(
    'INSERT INTO public.payments (id, application_id, amount) VALUES ($1, $2, 125.50)',
    [ID.payment1, ID.app1]
  );
  await source.query(
    'INSERT INTO public.installments (id, application_id, payment_id, numero) VALUES ($1, $2, $3, 1)',
    [ID.installment1, ID.app1, ID.payment1]
  );
  await source.query(
    'INSERT INTO public.payments_installments (id, payment_id, installment_id) VALUES (gen_random_uuid(), $1, $2)',
    [ID.payment1, ID.installment1]
  );
  await source.query(
    `INSERT INTO public.products (id, model) VALUES (gen_random_uuid(), 'Bera 150'), (gen_random_uuid(), 'Empire 200')`
  );
}

async function count(
  pool: Pool,
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const { rows } = await pool.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM (${sql}) t`,
    params
  );
  return Number(rows[0]?.n ?? 0);
}

describe('syncSaba', () => {
  beforeAll(async () => {
    await recreate(SOURCE_DB);
    await recreate(TARGET_DB);
    source = new Pool({ connectionString: urlFor(SOURCE_DB) });
    target = new Pool({ connectionString: urlFor(TARGET_DB) });
  });

  afterAll(async () => {
    await source.end();
    await target.end();
  });

  beforeEach(async () => {
    for (const pool of [source, target]) {
      await pool.query(`
        TRUNCATE auth.refresh_tokens, auth.sessions, auth.identities, public.payments_installments,
          public.installments, public.payments, public.appointments, public.application_documents,
          public.application_rejection_reasons, public.applications, public.user_documents,
          public.notifications, public.profiles, auth.users, public.products CASCADE`);
    }
    await seedProd();
  });

  it('copies the listed users with their applications, and the full catalogs', async () => {
    const report = await syncSaba({ source, target, users: USERS });

    expect(await count(target, 'SELECT * FROM auth.users')).toBe(2);
    const { rows: users } = await target.query(
      'SELECT email, encrypted_password FROM auth.users ORDER BY email COLLATE "C"'
    );
    // The real hash: you log in with the prod password.
    expect(users).toEqual([
      { email: CUSTOMER, encrypted_password: 'customer-hash' },
      { email: ADMIN, encrypted_password: 'hash-admin' },
    ]);
    expect(await count(target, 'SELECT * FROM auth.identities')).toBe(2);
    expect(await count(target, 'SELECT * FROM public.applications')).toBe(1);
    const { rows: apps } = await target.query(
      'SELECT status, metadata FROM public.applications'
    );
    expect(apps).toEqual([{ status: 'aprobada', metadata: { canal: 'web' } }]);
    const { rows: payments } = await target.query(
      'SELECT amount::text FROM public.payments'
    );
    expect(payments).toEqual([{ amount: '125.50' }]);
    expect(await count(target, 'SELECT * FROM public.installments')).toBe(1);
    expect(
      await count(target, 'SELECT * FROM public.payments_installments')
    ).toBe(1);
    expect(await count(target, 'SELECT * FROM public.products')).toBe(2);
    // Nothing from the user who is not on the list.
    expect(
      await count(target, "SELECT * FROM auth.users WHERE email = 'otro@x.com'")
    ).toBe(0);
    expect(
      report.tables.find((t) => t.table === 'public.applications')?.rows
    ).toBe(1);
  });

  it('when re-syncing, prod wins within scope and what is outside is untouched', async () => {
    await syncSaba({ source, target, users: USERS });
    // Locally: a test application of the customer (in scope) and a local-only user (out of scope).
    await target.query(
      "INSERT INTO public.applications (id, user_id, status) VALUES (gen_random_uuid(), $1, 'local')",
      [ID.customer]
    );
    await target.query(
      "INSERT INTO auth.users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'mio@local.dev')"
    );
    // In prod: the application's status changes.
    await source.query(
      "UPDATE public.applications SET status = 'pagada' WHERE id = $1",
      [ID.app1]
    );

    await syncSaba({ source, target, users: USERS });

    const { rows } = await target.query(
      'SELECT status FROM public.applications'
    );
    expect(rows).toEqual([{ status: 'pagada' }]);
    expect(
      await count(
        target,
        "SELECT * FROM auth.users WHERE email = 'mio@local.dev'"
      )
    ).toBe(1);
  });

  it('the prod user replaces the seed one with the same email and takes its sessions along', async () => {
    await target.query(
      "INSERT INTO auth.users (id, email, encrypted_password) VALUES ($1, $2, 'hash-seed')",
      [ID.seed, ADMIN]
    );
    await target.query(
      "INSERT INTO public.profiles (id, email, nombre, role) VALUES ($1, $2, 'Seed', 'admin')",
      [ID.seed, ADMIN]
    );
    await target.query(
      'INSERT INTO auth.sessions (id, user_id) VALUES (gen_random_uuid(), $1)',
      [ID.seed]
    );
    await target.query(
      'INSERT INTO auth.refresh_tokens (user_id) VALUES ($1)',
      [ID.seed]
    );

    await syncSaba({ source, target, users: USERS });

    const { rows } = await target.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [ADMIN]
    );
    expect(rows).toEqual([{ id: ID.admin }]);
    expect(
      await count(target, 'SELECT * FROM public.profiles WHERE id = $1', [
        ID.seed,
      ])
    ).toBe(0);
    expect(await count(target, 'SELECT * FROM auth.sessions')).toBe(0);
    expect(await count(target, 'SELECT * FROM auth.refresh_tokens')).toBe(0);
  });

  it('skips what does not exist on one side and reports it', async () => {
    await source.query(
      'ALTER TABLE public.profiles ADD COLUMN columna_nueva text'
    );
    try {
      const report = await syncSaba({
        source,
        target,
        users: { admins: [ADMIN], customers: [CUSTOMER, 'no-existe@saba.com'] },
      });

      expect(report.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('no-existe@saba.com'),
          expect.stringContaining('public.stores'),
          expect.stringContaining('columna_nueva'),
        ])
      );
      // Generated columns exist on both sides: they are not a difference.
      expect(report.warnings.join('\n')).not.toMatch(/confirmed_at|\(email\)/);
      expect(await count(target, 'SELECT * FROM public.profiles')).toBe(2);
    } finally {
      await source.query(
        'ALTER TABLE public.profiles DROP COLUMN columna_nueva'
      );
    }
  });

  it('warns if the roles do not match the list', async () => {
    await source.query(
      "UPDATE public.profiles SET role = 'standard' WHERE id = $1",
      [ID.admin]
    );
    await source.query(
      "UPDATE public.profiles SET role = 'cajero' WHERE id = $1",
      [ID.customer]
    );

    const report = await syncSaba({ source, target, users: USERS });

    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(new RegExp(`${ADMIN}.*no es staff`)),
        expect.stringMatching(/user-test.*es staff/),
      ])
    );
  });

  it('if loading fails, the previous copy stays intact', async () => {
    await syncSaba({ source, target, users: USERS });
    await source.query(
      "UPDATE public.applications SET status = 'nueva' WHERE id = $1",
      [ID.app1]
    );
    // A required column locally that prod does not have: the INSERT fails.
    await target.query(
      "ALTER TABLE public.payments ADD COLUMN obligatoria text NOT NULL DEFAULT 'x'"
    );
    await target.query(
      'ALTER TABLE public.payments ALTER COLUMN obligatoria DROP DEFAULT'
    );
    try {
      await expect(
        syncSaba({ source, target, users: USERS })
      ).rejects.toThrow();

      const { rows } = await target.query(
        'SELECT status FROM public.applications'
      );
      expect(rows).toEqual([{ status: 'aprobada' }]);
      expect(await count(target, 'SELECT * FROM auth.users')).toBe(2);
    } finally {
      await target.query('ALTER TABLE public.payments DROP COLUMN obligatoria');
    }
  });

  it('reads prod in a read-only transaction', async () => {
    const queries: string[] = [];
    const spy = new Proxy(source, {
      get(pool, prop, receiver) {
        if (prop !== 'connect') return Reflect.get(pool, prop, receiver);
        return async () => {
          const client = await pool.connect();
          const original = client.query.bind(client);
          (client as { query: unknown }).query = (
            text: unknown,
            ...rest: unknown[]
          ) => {
            if (typeof text === 'string') queries.push(text);
            return (original as (...args: unknown[]) => unknown)(text, ...rest);
          };
          return client;
        };
      },
    });

    await syncSaba({ source: spy, target, users: USERS });

    expect(queries[0]).toMatch(/BEGIN.*READ ONLY/);
    expect(queries.some((q) => /^\s*(INSERT|UPDATE|DELETE)/i.test(q))).toBe(
      false
    );
  });
});
