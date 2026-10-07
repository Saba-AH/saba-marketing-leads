import type { Pool, PoolClient } from 'pg';
import type { SyncUsers } from './sabaSyncUsers';
import { SYNC_PLAN, type SyncKey, type SyncStep } from './syncPlan';

const STAFF_ROLES = new Set(['admin', 'cajero', 'vendedor']);

export interface SyncTableReport {
  table: string;
  rows: number;
}

export interface SyncReport {
  tables: SyncTableReport[];
  warnings: string[];
}

export interface SyncSabaOptions {
  /** Prod. Solo se lee, en una transacción READ ONLY. */
  source: Pool;
  /** El Supabase local. Quien llama garantiza que sea local. */
  target: Pool;
  users: SyncUsers;
  plan?: readonly SyncStep[];
}

type Keys = Record<SyncKey, string[]>;

interface ReadStep {
  step: SyncStep;
  columns: string[];
  /** Filas como JSON de Postgres: así cada tipo vuelve tal cual al insertar. */
  json: string;
  rows: Array<Record<string, unknown>>;
}

/**
 * Copia de prod al Supabase local los usuarios de la lista con todo lo que
 * cuelga de ellos (ver `syncPlan.ts`). Prod manda: dentro del alcance, lo
 * local se borra y se vuelve a cargar, todo en una transacción; si algo falla,
 * queda la copia anterior.
 */
export async function syncSaba(options: SyncSabaOptions): Promise<SyncReport> {
  const plan = options.plan ?? SYNC_PLAN;
  const warnings: string[] = [];
  const emails = [...options.users.admins, ...options.users.clientes].map(
    (email) => email.trim().toLowerCase()
  );

  const source = await options.source.connect();
  const target = await options.target.connect();
  try {
    // Todo lo que toca prod va en una sola foto consistente y sin poder
    // escribir por error, incluso leer qué columnas tiene.
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    let read: ReadStep[];
    try {
      const columns = await resolveColumns(plan, source, target, warnings);
      read = await readSource(plan, columns, source, emails);
      await source.query('COMMIT');
    } catch (error: unknown) {
      await source.query('ROLLBACK');
      throw error;
    }
    warnings.push(...checkUsers(options.users, read));
    await load(plan, read, target, emails);
    return {
      tables: read.map(({ step, rows }) => ({
        table: step.table,
        rows: rows.length,
      })),
      warnings,
    };
  } finally {
    source.release();
    target.release();
  }
}

/**
 * Columnas a copiar por tabla: las que existen en los dos lados y se pueden
 * insertar en local (no generadas). Las versiones de Saba y de GoTrue pueden
 * diferir de nuestras migraciones: lo que no calza se avisa y se salta.
 */
async function resolveColumns(
  plan: readonly SyncStep[],
  source: PoolClient,
  target: PoolClient,
  warnings: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  for (const step of plan) {
    if (step.deleteOnly) continue;
    const [inSource, inTarget, insertable] = await Promise.all([
      tableColumns(source, step.table, false),
      tableColumns(target, step.table, false),
      tableColumns(target, step.table, true),
    ]);
    if (inSource.length === 0) {
      warnings.push(`${step.table}: no existe en prod, se salta`);
      continue;
    }
    if (inTarget.length === 0) {
      warnings.push(`${step.table}: no existe en local, se salta`);
      continue;
    }
    const sourceSet = new Set(inSource);
    const onlyInSource = inSource.filter(
      (column) => !inTarget.includes(column)
    );
    if (onlyInSource.length > 0) {
      warnings.push(
        `${step.table}: prod tiene columnas que local no (${onlyInSource.join(', ')}), no se copian`
      );
    }
    // Las generadas existen en los dos lados pero las calcula Postgres.
    result.set(
      step.table,
      insertable.filter((column) => sourceSet.has(column))
    );
  }
  return result;
}

async function tableColumns(
  client: PoolClient,
  table: string,
  insertableOnly: boolean
): Promise<string[]> {
  const [schema, name] = splitTable(table);
  const { rows } = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
       AND ($3 = false OR (is_generated = 'NEVER' AND coalesce(identity_generation, '') <> 'ALWAYS'))
     ORDER BY ordinal_position`,
    [schema, name, insertableOnly]
  );
  return rows.map((row) => row.column_name);
}

async function readSource(
  plan: readonly SyncStep[],
  columns: Map<string, string[]>,
  source: PoolClient,
  emails: string[]
): Promise<ReadStep[]> {
  const keys: Keys = {
    emails,
    userIds: [],
    applicationIds: [],
    paymentIds: [],
  };
  const read: ReadStep[] = [];
  for (const step of plan) {
    const stepColumns = columns.get(step.table);
    if (step.deleteOnly || !stepColumns) continue;
    const list = stepColumns
      .map((column) => source.escapeIdentifier(column))
      .join(', ');
    const where = step.where ? `WHERE ${step.where.sql}` : '';
    const params = step.where ? [keys[step.where.key]] : [];
    const { rows } = await source.query<{ json: string }>(
      `SELECT coalesce(json_agg(t), '[]')::text AS json
       FROM (SELECT ${list} FROM ${quoteTable(source, step.table)} ${where}) t`,
      params
    );
    const json = rows[0]?.json ?? '[]';
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>;
    if (step.produces) {
      keys[step.produces] = parsed.map((row) => String(row.id));
    }
    read.push({ step, columns: stepColumns, json, rows: parsed });
  }
  return read;
}

function checkUsers(users: SyncUsers, read: ReadStep[]): string[] {
  const rowsOf = (table: string): Array<Record<string, unknown>> =>
    read.find((step) => step.step.table === table)?.rows ?? [];
  const found = new Set(
    rowsOf('auth.users').map((row) => String(row.email).toLowerCase())
  );
  const roles = new Map(
    rowsOf('public.profiles').map((row) => [
      String(row.email).trim().toLowerCase(),
      row.role === null || row.role === undefined ? null : String(row.role),
    ])
  );

  const warnings: string[] = [];
  for (const email of [...users.admins, ...users.clientes]) {
    if (!found.has(email.toLowerCase())) {
      warnings.push(`${email}: no existe en prod`);
    }
  }
  for (const email of users.admins) {
    const role = roles.get(email.toLowerCase());
    if (found.has(email.toLowerCase()) && !STAFF_ROLES.has(role ?? '')) {
      warnings.push(
        `${email}: está en admins pero en prod no es staff (rol ${role ?? 'sin perfil'})`
      );
    }
  }
  for (const email of users.clientes) {
    const role = roles.get(email.toLowerCase());
    if (role && STAFF_ROLES.has(role)) {
      warnings.push(
        `${email}: está en clientes pero en prod es staff (rol ${role})`
      );
    }
  }
  return warnings;
}

/**
 * Borra el alcance en local y carga lo leído. El alcance local se calcula con
 * los ids de prod **y** los de local: el admin del seed tiene el mismo correo
 * que el de prod pero otro id, y también tiene que irse.
 *
 * Las FKs van apagadas (`session_replication_role = replica`): el corte es
 * parcial y hay referencias a filas que no se copian (cuentas, almacenes…).
 */
async function load(
  plan: readonly SyncStep[],
  read: ReadStep[],
  target: PoolClient,
  emails: string[]
): Promise<void> {
  const fromSource: Keys = {
    emails,
    userIds: [],
    applicationIds: [],
    paymentIds: [],
  };
  for (const { step, rows } of read) {
    if (step.produces)
      fromSource[step.produces] = rows.map((row) => String(row.id));
  }
  const present = await existingTables(plan, target);

  await target.query('BEGIN');
  try {
    await target.query('SET LOCAL session_replication_role = replica');

    const keys: Keys = { ...fromSource };
    for (const step of plan) {
      if (!step.produces || !step.where || !present.has(step.table)) continue;
      const { rows } = await target.query<{ id: string }>(
        `SELECT id::text FROM ${quoteTable(target, step.table)} WHERE ${step.where.sql}`,
        [keys[step.where.key]]
      );
      keys[step.produces] = [
        ...new Set([...keys[step.produces], ...rows.map((row) => row.id)]),
      ];
    }

    for (const step of [...plan].reverse()) {
      if (!present.has(step.table)) continue;
      const where = step.where ? `WHERE ${step.where.sql}` : '';
      const params = step.where ? [keys[step.where.key]] : [];
      await target.query(
        `DELETE FROM ${quoteTable(target, step.table)} ${where}`,
        params
      );
    }

    for (const { step, columns, json, rows } of read) {
      if (rows.length === 0) continue;
      const list = columns
        .map((column) => target.escapeIdentifier(column))
        .join(', ');
      const table = quoteTable(target, step.table);
      await target.query(
        `INSERT INTO ${table} (${list})
         SELECT ${list} FROM json_populate_recordset(NULL::${table}, $1::json)`,
        [json]
      );
    }
    await target.query('COMMIT');
  } catch (error: unknown) {
    await target.query('ROLLBACK');
    throw error;
  }
}

async function existingTables(
  plan: readonly SyncStep[],
  target: PoolClient
): Promise<Set<string>> {
  const { rows } = await target.query<{ name: string }>(
    'SELECT name FROM unnest($1::text[]) AS name WHERE to_regclass(name) IS NOT NULL',
    [plan.map((step) => step.table)]
  );
  return new Set(rows.map((row) => row.name));
}

function splitTable(table: string): [string, string] {
  const [schema, name] = table.split('.');
  if (!schema || !name)
    throw new Error(`tabla sin esquema en el plan: ${table}`);
  return [schema, name];
}

function quoteTable(client: PoolClient, table: string): string {
  const [schema, name] = splitTable(table);
  return `${client.escapeIdentifier(schema)}.${client.escapeIdentifier(name)}`;
}
