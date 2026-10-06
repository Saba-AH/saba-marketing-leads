/**
 * Puente entre el stack local de Supabase y las tareas del monorepo.
 *
 *   node scripts/localSupabase.mjs start            levanta el stack (salida corta)
 *   node scripts/localSupabase.mjs exec <cmd...>    corre <cmd> con el entorno local
 *
 * `exec` lee `supabase status` y exporta lo que la API necesita para hablar con
 * el stack: así nadie copia puertos ni llaves a su `.env`, y no se
 * desincronizan si cambia `supabase/config.toml`. Solo cuando la base elegida
 * es la local: con `DB_TARGET=supabase` (o `DATABASE` explícita) no toca nada y
 * manda el `.env`.
 */
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

/** Variable de la API ← clave de `supabase status -o json`. */
const FROM_STATUS = {
  DATABASE_LOCAL: 'DB_URL',
};

const SHELL = process.platform === 'win32';

function apiEnvFile() {
  try {
    return parse(readFileSync(new URL('../apps/api/.env', import.meta.url)));
  } catch {
    return {};
  }
}

function usesLocalStack() {
  const file = apiEnvFile();
  const target = process.env.DB_TARGET ?? file.DB_TARGET ?? 'local';
  const explicit = process.env.DATABASE ?? file.DATABASE;
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

/** Avisos de `supabase start` que no aportan: apagamos esos servicios a propósito. */
const NOISE = [/^Stopped services:/];

function start() {
  // La tabla de `supabase start` sale en cada `npm run dev`: se descarta
  // stdout y de stderr queda lo útil (progreso de imágenes, errores).
  const child = spawn('supabase', ['start'], {
    stdio: ['ignore', 'ignore', 'pipe'],
    shell: SHELL,
  });
  let pending = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    const lines = (pending + chunk).split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      if (!NOISE.some((pattern) => pattern.test(line))) {
        process.stderr.write(`${line}\n`);
      }
    }
  });
  child.on('exit', (code) => {
    if (pending && !NOISE.some((pattern) => pattern.test(pending))) {
      process.stderr.write(`${pending}\n`);
    }
    if (code !== 0) process.exit(code ?? 1);
    const { STUDIO_URL, DB_URL } = status();
    console.log(`✓ Supabase local · Studio ${STUDIO_URL} · Postgres ${DB_URL}`);
  });
}

function exec(command, args) {
  const env = { ...process.env };
  if (usesLocalStack()) {
    const local = status();
    for (const [name, key] of Object.entries(FROM_STATUS)) {
      // Lo que ya venga del shell manda: sirve para forzar un valor puntual.
      env[name] ??= local[key];
    }
  }
  const child = spawn(command, args, { stdio: 'inherit', env, shell: SHELL });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

const [mode, command, ...args] = process.argv.slice(2);
if (mode === 'start') {
  start();
} else if (mode === 'exec' && command) {
  exec(command, args);
} else {
  console.error(
    'uso: node scripts/localSupabase.mjs start | exec <comando...>'
  );
  process.exit(1);
}
