# Saba Marketing Leads

Monorepo **fullstack**: `apps/api` (NestJS + Drizzle sobre Postgres/Supabase) +
`apps/client` (Next.js 15 SSR) sobre **Turborepo** y npm workspaces, con
packages compartidos, reglas y skills de agentes (Matt Pocock) y Ralph.

## Requisitos

- Node **>= 20** (CI usa 22) y npm 11
- **Docker** (lo usa el stack local de Supabase: Postgres + Auth, para desarrollo y tests)

## Arranque

```bash
npm install
cp apps/api/.env.example apps/api/.env       # valores por defecto sirven en local
npm run dev                                  # Supabase local + migraciones + seed + API (8080) + cliente (3002)
```

- Cliente: http://localhost:3002 (estado del sistema) y http://localhost:3002/leads
- API: http://localhost:8080/api/v1/health · Swagger: http://localhost:8080/api/docs
- Supabase Studio local: http://localhost:54333
- Admin de desarrollo (lo crea `db:seed`, solo en local): `angel.hernandez@sabatransporte.com` / `12345678`

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Levanta Supabase local, migra, siembra y arranca API y cliente |
| `npm run build` | Compila packages, API y cliente |
| `npm run typecheck` | `tsc --noEmit` en cada workspace |
| `npm test` | Vitest (API, contra el Postgres del Supabase local) + Jest (cliente, MSW) |
| `npm run format-and-lint` | `biome check .` — lo mismo que corre el CI |
| `npm run db:up` / `db:down` / `db:status` | Stack local de Supabase (`supabase start` / `stop` / `status`) |
| `npm run db:setup` / `db:reset` | Migra y siembra / recrea el stack desde cero (borra los datos locales) |
| `npm -C apps/api run db:generate` | Nueva migración desde los `*.schema.ts` (escribir su `drizzle/down/<tag>.down.sql`) |
| `npm -C apps/api run db:migrate` / `db:rollback` / `db:seed` | Migraciones sobre `DATABASE` |

## Estructura

```
.
├── apps/
│   ├── api/            # NestJS hexagonal — único camino a los datos
│   └── client/         # Next.js SSR (standalone) — organizado por features
├── packages/
│   ├── schemas/        # Zod: contrato de la API (lo comparten ambas apps)
│   ├── services/       # Cliente HTTP tipado sobre schemas
│   ├── ui/             # shadcn/ui + tokens de Tailwind
│   ├── utils/          # Helpers sin framework
│   └── typescript-config/
├── supabase/           # config del stack local de Supabase (db + auth + studio)
├── .claude/ · .agents/ # reglas y skills de agentes (mattpocock/skills, ver skills-lock.json)
├── docs/agents/        # cómo consumen las skills el tracker, labels y docs de dominio
├── ralph/              # loop autónomo de agentes (AFK)
└── .scratch/           # PRDs/specs por épica
```

## Base de datos: Supabase local en desarrollo, Supabase en la nube

Drizzle habla Postgres, y Supabase **es** Postgres: no hay que cambiar código.

- **Local/tests:** el stack de Supabase CLI (`supabase/config.toml`): Postgres en
  `:54332`, Auth y Studio en `:54331`/`:54333` (puertos propios para convivir con
  otro stack local). Las migraciones son **las de Drizzle**, no las del CLI. Los
  tests de la API crean y migran una base aparte (`app_dev_test`) en el
  `globalSetup` de Vitest y truncan entre tests.
- **Variables del stack:** `npm run dev` corre las tareas con
  `scripts/localSupabase.mjs`, que lee `supabase status` y exporta la conexión
  (y, con auth, las llaves) al entorno. No se copian al `.env`; con
  `DB_TARGET=supabase` el script no inyecta nada y manda el `.env`.
- **Supabase:** poner en `DATABASE` la connection string del proyecto
  (Dashboard → Connect; para migrar usar la de puerto 5432) y correr
  `npm -C apps/api run db:migrate`.

## Módulo de referencia: `leads`

Recorre el camino completo: `packages/schemas/src/lead` (contrato Zod) →
`apps/api/src/modules/leads` (dominio · casos de uso · repositorio Drizzle ·
controlador) → `apps/api/drizzle/` (migración + reversa) →
`packages/services` (`api.v1.leads`) → `apps/client/src/features/leads` (React
Query + react-hook-form) → tests en ambos lados.

## Docker

```bash
docker build -f apps/api/Dockerfile -t saba-leads-api .
docker build -f apps/api/Dockerfile --target migrator -t saba-leads-migrator .
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t saba-leads-client .
```
