/**
 * Puente entre el stack local de Supabase y las tareas del monorepo.
 *
 *   node scripts/localSupabase.mjs dev <destino>    `npm run dev:local` / `dev:supabase`
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
  // Solo para el banner de arranque de la API.
  SUPABASE_STUDIO_URL: 'STUDIO_URL',
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
 * El destino lo elige el comando (`npm run dev:local` / `dev:supabase`), que
 * fija DB_TARGET para el proceso; no se configura en el `.env`. Una
 * `DATABASE` explícita (despliegue, CI) gana sobre todo.
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
      // Lo que ya venga del shell manda: sirve para forzar un valor puntual.
      env[name] ??= local[key];
    }
  }
  return env;
}

/** Corre el comando y resuelve si sale bien; si falla, termina con su código. */
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

/**
 * `npm run dev`. Levantar el stack, migrar y sembrar solo tiene sentido contra
 * la base local: con `DB_TARGET=supabase` en el `.env`, migrar en cada
 * arranque tocaría producción. Ahí solo arrancan las apps.
 */
const TARGETS = ['local', 'supabase'];

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
  // `dev:info` es el resumen de la API en el sidebar de turbo.
  await run('turbo', ['run', 'dev', 'dev:info'], localEnv());
}

const [mode, command, ...args] = process.argv.slice(2);
if (mode === 'dev') {
  await dev(command);
} else if (mode === 'start') {
  await start();
} else if (mode === 'exec' && command) {
  await run(command, args, localEnv());
} else {
  console.error(
    'uso: node scripts/localSupabase.mjs dev [local|supabase] | start | exec <comando...>'
  );
  process.exit(1);
}
