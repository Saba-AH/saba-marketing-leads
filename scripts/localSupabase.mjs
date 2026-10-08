/**
 * Bridge between the local Supabase stack and the monorepo tasks.
 *
 *   node scripts/localSupabase.mjs dev <target>     `npm run dev:local` / `dev:supabase`
 *   node scripts/localSupabase.mjs sync             `npm run db:sync:saba` (see `sync()`)
 *   node scripts/localSupabase.mjs start            brings up the stack (short output)
 *   node scripts/localSupabase.mjs exec <cmd...>    runs <cmd> with the local environment
 *
 * `exec` reads `supabase status` and exports what the API needs to talk to the
 * stack: that way nobody copies ports or keys into their `.env`, and they do
 * not drift if `supabase/config.toml` changes. Only when the chosen database is
 * the local one: with `npm run dev:supabase` (or an explicit `DATABASE`) it
 * touches nothing and `.env` wins.
 */
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

/** API variable ← key in `supabase status -o json`. */
const FROM_STATUS = {
  DATABASE_LOCAL: 'DB_URL',
  // Only for the API's startup banner.
  SUPABASE_STUDIO_URL: 'STUDIO_URL',
  // `modules/auth/infrastructure/authConfig.ts`. Supabase's `API_URL` is renamed:
  // in the monorepo `API_URL` is the NestJS one (the client's BFF).
  SUPABASE_URL: 'API_URL',
  SUPABASE_PUBLISHABLE_KEY: 'PUBLISHABLE_KEY',
  SUPABASE_JWT_SECRET: 'JWT_SECRET',
};

const SHELL = process.platform === 'win32';

function apiEnvFile() {
  try {
    return parse(readFileSync(new URL('../apps/api/.env', import.meta.url)));
  } catch {
    return {};
  }
}

/**
 * The target is chosen by the command (`npm run dev:local` / `dev:supabase`),
 * which sets DB_TARGET for the process; it is not configured in `.env`. An
 * explicit `DATABASE` (deploy, CI) wins over everything.
 */
function usesLocalStack() {
  const target = process.env.DB_TARGET ?? 'local';
  const explicit = process.env.DATABASE ?? apiEnvFile().DATABASE;
  return target.trim().toLowerCase() === 'local' && !explicit;
}

function status() {
  const json = execFileSync('supabase', ['status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    shell: SHELL,
  });
  return JSON.parse(json);
}

/** `supabase start` warnings that add nothing: we turn those services off on purpose. */
const NOISE = [/^Stopped services:/];

function start() {
  // The `supabase start` table comes out on every `npm run dev`: stdout is
  // discarded and only the useful part of stderr stays (image progress, errors).
  const child = spawn('supabase', ['start'], {
    stdio: ['ignore', 'ignore', 'pipe'],
    shell: SHELL,
  });
  let pending = '';
  const forward = (line) => {
    if (!NOISE.some((pattern) => pattern.test(line))) {
      process.stderr.write(`${line}\n`);
    }
  };
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    const lines = (pending + chunk).split('\n');
    pending = lines.pop() ?? '';
    lines.forEach(forward);
  });
  return new Promise((resolve) => {
    child.on('exit', (code) => {
      if (pending) forward(pending);
      if (code !== 0) process.exit(code ?? 1);
      const { STUDIO_URL, DB_URL } = status();
      console.log(
        `✓ Supabase local · Studio ${STUDIO_URL} · Postgres ${DB_URL}`
      );
      resolve();
    });
  });
}

function localEnv() {
  const env = { ...process.env };
  if (usesLocalStack()) {
    const local = status();
    for (const [name, key] of Object.entries(FROM_STATUS)) {
      // Whatever already comes from the shell wins: useful to force a specific value.
      env[name] ??= local[key];
    }
  }
  return env;
}

/** Runs the command and resolves if it succeeds; if it fails, exits with its code. */
function run(command, args, env) {
  const child = spawn(command, args, { stdio: 'inherit', env, shell: SHELL });
  return new Promise((resolve) => {
    child.on('exit', (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      if (code !== 0) process.exit(code ?? 1);
      resolve();
    });
  });
}

const TARGETS = ['local', 'supabase'];

/**
 * `npm run dev:local` / `dev:supabase`. Bringing up the stack, migrating and
 * seeding only make sense against the local database: against Supabase,
 * migrating on every start would touch production. There only the apps start.
 */
async function dev(target = 'local') {
  if (!TARGETS.includes(target)) {
    console.error(
      `destino desconocido: ${target} (usar ${TARGETS.join(' | ')})`
    );
    process.exit(1);
  }
  process.env.DB_TARGET = target;
  if (usesLocalStack()) {
    await start();
    await run('npm', ['run', 'db:setup'], localEnv());
  } else {
    console.log(
      '· Supabase remoto: sin stack local ni migraciones (migrar a mano con `npm run db:migrate:supabase`)'
    );
  }
  // `dev:info` is the API summary in turbo's sidebar.
  await run('turbo', ['run', 'dev', 'dev:info'], localEnv());
}

/**
 * `npm run db:sync:saba`: copies the users from
 * `apps/api/scripts/sync/sabaSyncUsers.ts` from prod. It forces the local
 * target: the preceding `db:migrate` can never point to prod.
 */
async function sync() {
  process.env.DB_TARGET = 'local';
  await start();
  const env = localEnv();
  await run('npm', ['run', 'db:migrate'], env);
  await run('npm', ['-C', 'apps/api', 'run', 'db:sync:saba'], env);
}

const [mode, command, ...args] = process.argv.slice(2);
if (mode === 'dev') {
  await dev(command);
} else if (mode === 'sync') {
  await sync();
} else if (mode === 'start') {
  await start();
} else if (mode === 'exec' && command) {
  await run(command, args, localEnv());
} else {
  console.error(
    'uso: node scripts/localSupabase.mjs dev [local|supabase] | sync | start | exec <comando...>'
  );
  process.exit(1);
}
