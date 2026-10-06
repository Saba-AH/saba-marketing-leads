import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { syncSaba } from '../../../scripts/sync/syncSaba';
import { testBaseDatabaseUrl } from '../../infrastructure/database/migrator';

/**
 * Copia entre dos bases locales: `prod` hace de Supabase de Saba y `local` de
 * destino. El esquema es mínimo (solo las columnas que el sync filtra o que los
 * casos necesitan) pero imita lo que importa del real: `auth` con columnas
 * generadas, FKs entre tablas y una tabla del plan que en local no existe
 * (`stores`).
 */
const SOURCE_DB = 'app_sync_prod_test';
const TARGET_DB = 'app_sync_local_test';

const ADMIN = 'angel.hernandez@sabatransporte.com';
const CLIENTE = 'angel.hernandez+user-test@sabatransporte.com';
const USERS = { admins: [ADMIN], clientes: [CLIENTE] };

const ID = {
  admin: '00000000-0000-0000-0000-00000000000a',
  cliente: '00000000-0000-0000-0000-00000000000c',
  otro: '00000000-0000-0000-0000-0000000000ff',
  seed: 'de000000-0000-0000-0000-000000000001',
  app1: '00000000-0000-0000-0000-0000000000a1',
  appOtro: '00000000-0000-0000-0000-0000000000a9',
  pago1: '00000000-0000-0000-0000-0000000000b1',
  cuota1: '00000000-0000-0000-0000-0000000000c1',
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
       ($1, $4, 'hash-admin', now()), ($2, $5, 'hash-cliente', now()), ($3, 'otro@x.com', 'hash-otro', now())`,
    [ID.admin, ID.cliente, ID.otro, ADMIN, CLIENTE]
  );
  await source.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, identity_data) VALUES
       ($1, $1, $3, jsonb_build_object('email', $3::text)), ($2, $2, $4, jsonb_build_object('email', $4::text))`,
    [ID.admin, ID.cliente, ADMIN, CLIENTE]
  );
  await source.query(
    `INSERT INTO public.profiles (id, email, nombre, role) VALUES
       ($1, $4, 'Angel', 'admin'), ($2, $5, 'Angel Test', 'standard'), ($3, 'otro@x.com', 'Otro', 'standard')`,
    [ID.admin, ID.cliente, ID.otro, ADMIN, CLIENTE]
  );
  await source.query(
    `INSERT INTO public.applications (id, user_id, status, metadata) VALUES
       ($1, $2, 'aprobada', '{"canal":"web"}'), ($3, $4, 'pendiente', null)`,
    [ID.app1, ID.cliente, ID.appOtro, ID.otro]
  );
  await source.query(
    'INSERT INTO public.payments (id, application_id, amount) VALUES ($1, $2, 125.50)',
    [ID.pago1, ID.app1]
  );
  await source.query(
    'INSERT INTO public.installments (id, application_id, payment_id, numero) VALUES ($1, $2, $3, 1)',
    [ID.cuota1, ID.app1, ID.pago1]
  );
  await source.query(
    'INSERT INTO public.payments_installments (id, payment_id, installment_id) VALUES (gen_random_uuid(), $1, $2)',
    [ID.pago1, ID.cuota1]
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

  it('copia los usuarios de la lista con sus solicitudes, y los catálogos completos', async () => {
    const report = await syncSaba({ source, target, users: USERS });

    expect(await count(target, 'SELECT * FROM auth.users')).toBe(2);
    const { rows: usuarios } = await target.query(
      'SELECT email, encrypted_password FROM auth.users ORDER BY email COLLATE "C"'
    );
    // El hash real: se entra con la contraseña de prod.
    expect(usuarios).toEqual([
      { email: CLIENTE, encrypted_password: 'hash-cliente' },
      { email: ADMIN, encrypted_password: 'hash-admin' },
    ]);
    expect(await count(target, 'SELECT * FROM auth.identities')).toBe(2);
    expect(await count(target, 'SELECT * FROM public.applications')).toBe(1);
    const { rows: apps } = await target.query(
      'SELECT status, metadata FROM public.applications'
    );
    expect(apps).toEqual([{ status: 'aprobada', metadata: { canal: 'web' } }]);
    const { rows: pagos } = await target.query(
      'SELECT amount::text FROM public.payments'
    );
    expect(pagos).toEqual([{ amount: '125.50' }]);
    expect(await count(target, 'SELECT * FROM public.installments')).toBe(1);
    expect(
      await count(target, 'SELECT * FROM public.payments_installments')
    ).toBe(1);
    expect(await count(target, 'SELECT * FROM public.products')).toBe(2);
    // Nada del usuario que no está en la lista.
    expect(
      await count(target, "SELECT * FROM auth.users WHERE email = 'otro@x.com'")
    ).toBe(0);
    expect(
      report.tables.find((t) => t.table === 'public.applications')?.rows
    ).toBe(1);
  });

  it('al re-sincronizar, prod manda dentro del alcance y lo de afuera no se toca', async () => {
    await syncSaba({ source, target, users: USERS });
    // En local: una solicitud de prueba del cliente (alcance) y un usuario propio (afuera).
    await target.query(
      "INSERT INTO public.applications (id, user_id, status) VALUES (gen_random_uuid(), $1, 'local')",
      [ID.cliente]
    );
    await target.query(
      "INSERT INTO auth.users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'mio@local.dev')"
    );
    // En prod: cambia el estado de la solicitud.
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

  it('el usuario de prod reemplaza al del seed con el mismo correo y se lleva sus sesiones', async () => {
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

  it('salta lo que no existe de un lado y lo avisa', async () => {
    await source.query(
      'ALTER TABLE public.profiles ADD COLUMN columna_nueva text'
    );
    try {
      const report = await syncSaba({
        source,
        target,
        users: { admins: [ADMIN], clientes: [CLIENTE, 'no-existe@saba.com'] },
      });

      expect(report.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('no-existe@saba.com'),
          expect.stringContaining('public.stores'),
          expect.stringContaining('columna_nueva'),
        ])
      );
      // Las generadas existen en los dos lados: no son una diferencia.
      expect(report.warnings.join('\n')).not.toMatch(/confirmed_at|\(email\)/);
      expect(await count(target, 'SELECT * FROM public.profiles')).toBe(2);
    } finally {
      await source.query(
        'ALTER TABLE public.profiles DROP COLUMN columna_nueva'
      );
    }
  });

  it('avisa si los roles no coinciden con la lista', async () => {
    await source.query(
      "UPDATE public.profiles SET role = 'standard' WHERE id = $1",
      [ID.admin]
    );
    await source.query(
      "UPDATE public.profiles SET role = 'cajero' WHERE id = $1",
      [ID.cliente]
    );

    const report = await syncSaba({ source, target, users: USERS });

    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(new RegExp(`${ADMIN}.*no es staff`)),
        expect.stringMatching(/user-test.*es staff/),
      ])
    );
  });

  it('si algo falla al cargar, la copia anterior queda intacta', async () => {
    await syncSaba({ source, target, users: USERS });
    await source.query(
      "UPDATE public.applications SET status = 'nueva' WHERE id = $1",
      [ID.app1]
    );
    // Una columna obligatoria en local que prod no trae: el INSERT falla.
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

  it('lee prod en una transacción de solo lectura', async () => {
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
