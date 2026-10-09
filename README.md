# Saba Marketing Leads

Monorepo **fullstack**: `apps/api` (NestJS + Drizzle sobre Postgres) +
`apps/client` (Next.js 15 SSR) sobre **Turborepo** y npm workspaces, con
packages compartidos, reglas y skills de agentes (Matt Pocock) y Ralph.

## Requisitos

- Node **>= 20** (CI usa 22) y npm 11
- **Docker** (el Postgres local de `docker-compose.yml`, para desarrollo y tests)
- El **servidor de Saba** corriendo (`saba/`, puerto 3001 por defecto): el login y los datos de clientes salen de él

## Arranque

```bash
npm install
cp apps/api/.env.example apps/api/.env       # completar SABA_SERVICE_KEY (ver abajo)
npm run dev                                  # Postgres local + migraciones + API (8080) + cliente (3002)
```

- Cliente: http://localhost:3002 (estado del sistema) y http://localhost:3002/leads
- API: http://localhost:8080/api/v1/health · Swagger: http://localhost:8080/api/docs
- Se entra con un usuario **staff de Saba** que tenga `profiles.has_marketing_access = true`.

### Conexión con Saba: la service key

La API de marketing se identifica ante Saba con un secreto compartido:

```bash
openssl rand -hex 32
```

El mismo valor va en `MARKETING_SERVICE_KEY` (`.env` de Saba) y en
`SABA_SERVICE_KEY` (`apps/api/.env`). Uno distinto por entorno; nunca en el
cliente. Si falta en Saba, todo `/api/marketing/*` responde 401; si falta acá, la
API no arranca.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Levanta el Postgres de Compose, migra y arranca API y cliente. En el sidebar de turbo, `@repo/api#dev:info` resume contra qué base y qué Saba corre |
| `npm run build` | Compila packages, API y cliente |
| `npm run typecheck` | `tsc --noEmit` en cada workspace |
| `npm test` | Vitest (API, contra el Postgres local) + Jest (cliente, MSW) |
| `npm run format-and-lint` | `biome check .` — lo mismo que corre el CI |
| `npm run db:up` / `db:down` | Postgres local de `docker-compose.yml` |
| `npm run db:migrate` | Migraciones sobre `DATABASE` |
| `npm run db:reset` | Borra el volumen local, levanta y migra desde cero (borra los datos locales) |
| `npm -C apps/api run db:generate` | Nueva migración desde los `*.schema.ts` (escribir su `drizzle/down/<tag>.down.sql`) |
| `npm -C apps/api run db:rollback` | Revierte la última migración (`-- --all`: todas) |

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
├── docker-compose.yml  # Postgres local; perfil `full` con las imágenes de producción
├── .claude/ · .agents/ # reglas y skills de agentes (mattpocock/skills, ver skills-lock.json)
├── docs/agents/        # cómo consumen las skills el tracker, labels y docs de dominio
├── ralph/              # loop autónomo de agentes (AFK)
└── .scratch/           # PRDs/specs por épica
```

## Base de datos y Saba

- **Postgres propio** (WhatsApp, leads): en local, el de `docker-compose.yml` en
  el puerto **5434** (5432 y 5433 suelen estar ocupados). En dev/prod, un
  Postgres en una EC2. Cambiar de entorno es cambiar `DATABASE` en
  `apps/api/.env`, nunca el comando. Las migraciones son las de Drizzle
  (`npm run db:migrate`).
- **Tests:** la API crea y migra una base aparte (`app_dev_test`) en el mismo
  servidor y trunca entre tests. Se niega a correr si `DATABASE` no es local.
- **Saba:** login, sesiones, permisos y clientes salen de los endpoints
  `/api/marketing/*` de su servidor (`SABA_API_URL`), nunca de su base. Ver
  `docs/api_modules.md`.
- **Imágenes de producción en local:** `docker compose --profile full up --build`.

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
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>  -t saba-leads-client .
```
