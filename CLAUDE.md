# CLAUDE.md — Saba Marketing Leads (raíz del monorepo)

Repo del proyecto **Saba Marketing Leads**. Monorepo fullstack: `apps/api` (NestJS) + `apps/client`
(Next.js SSR) sobre Turborepo, con packages compartidos. Aplica a todo el repo. Si
una subcarpeta tiene su propio `CLAUDE.md`, manda **el más específico**.

---

## El cliente corre con SSR

**`apps/client` es SSR** (`output: 'standalone'`): un servidor Node de Next, empaquetado en su propio contenedor (`apps/client/Dockerfile`).

La restricción que **sí** se mantiene es la **frontera de datos**: el cliente **nunca** toca Postgres/Supabase directamente (ni con `@supabase/supabase-js`). Todo dato de dominio pasa por la API de NestJS (`apps/api`). Si necesitas lógica de negocio o acceso a datos, va en `apps/api` — no en un route handler del cliente.

Dentro de esa frontera, en `apps/client` ya están permitidos Server Components con fetch en servidor, route handlers y middleware. El servidor de Next puede leer variables de entorno en runtime (no todo tiene que hornearse en build).

---

## Base de datos: Postgres (Supabase)

- **Local y tests:** stack local de Supabase CLI (`supabase/config.toml`: Postgres en **54332**, Auth en 54331, Studio en 54333). Las migraciones son las de Drizzle (el CLI tiene las suyas apagadas); `db:seed` crea un admin de desarrollo y se niega a correr contra una base remota. `npm run dev` toma la conexión del stack de `supabase status` (`scripts/localSupabase.mjs`), no del `.env`. Los tests de la API corren contra una base aparte (`app_dev_test`) que el `globalSetup` de Vitest crea y migra.
- **Staging/producción:** **Supabase** (que es Postgres). Solo cambia `DATABASE` en `apps/api/.env` / en el entorno del despliegue. Las migraciones de Drizzle se aplican igual (`npm -C apps/api run db:migrate`).
- El ORM es **Drizzle** (`drizzle-orm/node-postgres`). Las PK usan `gen_random_uuid()` (nativo de Postgres, funciona igual en Docker y Supabase).

---

## Estructura

```
.
├── apps/
│   ├── api/            # NestJS — único camino a datos (Postgres/Supabase)
│   └── client/         # Next.js SSR (standalone) — panel interno
├── packages/
│   ├── schemas/        # Zod + tipos del contrato de API (lo comparten ambas apps)
│   ├── services/       # Cliente HTTP y servicios sobre schemas
│   ├── ui/             # shadcn/ui + tokens de Tailwind
│   ├── utils/          # Helpers sin acoplamiento a framework
│   └── typescript-config/
├── supabase/           # Stack local de Supabase (db + auth + studio) para dev y tests
├── ralph/              # Loop autónomo de agentes (AFK)
└── .scratch/           # Issues y PRDs por épica
```

**Regla del monorepo:** si algo lo usan las dos apps de TypeScript, va en `packages/*`. Las apps se mantienen delgadas. Un servicio en otro lenguaje (p. ej. un microservicio Python) queda fuera de ese grafo: se habla con él por HTTP, nunca por import.

**El contrato de la API vive en `packages/schemas`.** Un endpoint nuevo define su esquema Zod ahí, la API lo usa para validar y documentar, y el cliente lo usa para parsear. Si el contrato cambia sin que ambos lados se enteren, los tests fallan.

**Arquitectura del sistema:** Frontend → API → Datos. El cliente **nunca** toca Postgres/Supabase directamente.

**Variables `NEXT_PUBLIC_*`:** Next las inlinea en el bundle en build time, así que viajan como `--build-arg` del `Dockerfile` del cliente, no como env vars de runtime.

---

## Comandos

Desde la raíz:

| Comando | Qué hace |
|---------|----------|
| `npm run dev` / `dev:local` | Levanta Supabase local, migra, siembra y arranca API y cliente |
| `npm run dev:supabase` | API y cliente contra el Supabase real (sin migrar). El destino lo elige el comando, no el `.env` |
| `npm run db:up` / `db:down` / `db:status` | Stack local de Supabase |
| `npm run db:setup` / `db:reset` | Migra y siembra / recrea el stack desde cero |
| `npm -C apps/api run db:generate` | Genera una migración de Drizzle desde los `*.schema.ts` |
| `npm -C apps/api run db:migrate` | Aplica migraciones sobre `DATABASE` (local o Supabase) |
| `npm run build` | Compila todo; el cliente emite su servidor SSR en `apps/client/.next/` |
| `npm run typecheck` | `tsc --noEmit` en cada workspace |
| `npm run lint` | Biome, sin escribir |
| `npm test` | Vitest (API, contra el Postgres del Supabase local) + Jest (cliente, con MSW) |
| `npm run format-and-lint` | `biome check .` — lo mismo que corre el CI |

Nunca arranques un servidor de desarrollo ni hagas `curl` a endpoints locales por tu cuenta.

---

## Convenciones

### General

- **camelCase** para carpetas y para archivos que no exportan un componente React. Los archivos de componente van en **PascalCase**, igual que el componente (`SystemStatusCard.tsx`, `HealthController.ts`).
- Comentarios mínimos: solo el **por qué**, nunca el qué.
- Los tests son la documentación preferida.

### TypeScript

- Nada de `any` / `as any`.
- `interface` para formas de objeto; `type` para uniones y mapeados.
- Funciones públicas con tipo de retorno explícito.
- Preferir declaraciones de función y funciones con nombre.
- `async/await` sobre `.then()`.
- **Zod** para validar en los bordes.
- Evitar barrels (`index.ts`) que oculten fronteras. Excepción viva: `features/*/infrastructure/index.ts`, que es donde se cablea el cliente de API.

### apps/api

Arquitectura hexagonal por módulo: `domain/` · `application/{ports,use-cases}` · `infrastructure/{web,persistence}`. El dominio no importa nada de Nest. Ver `apps/api/src/modules/leads/` (CRUD con Postgres) y `apps/api/src/modules/health/` como referencia.

### apps/client

Organizado **por features**, no por tipo de archivo:

```
features/<feature>/
├── domain/          # modelo y reglas de la feature
├── application/     # queries y mutations de React Query, casos de uso
├── infrastructure/  # servicios contra la API + transformadores DTO → dominio
└── ui/              # components · widgets · pages · layouts
```

Una feature no importa de otra. Lo compartido vive en `src/shared/`. Ver `features/leads/` y `features/systemStatus/` como referencia.

### Reglas detalladas (`.claude/rules/`)

Estándares generales del repo (se cargan por referencia):

@.claude/rules/git-workflow.md
@.claude/rules/typescript.md

Cada app tiene además sus reglas propias en `apps/api/.claude/rules/` y
`apps/client/.claude/rules/`, referenciadas desde su `CLAUDE.md`.

---

## Agent skills

### Skills de ingeniería (Matt Pocock)

Instaladas en `.claude/skills/` y `.agents/skills/`, pineadas en `skills-lock.json` (origen `mattpocock/skills`). Se invocan como slash commands:

| Comando | Qué hace |
|---------|----------|
| `/setup-matt-pocock-skills` | Configuración por repo (tracker, triage labels, ubicación de docs de dominio). Se corre una vez. |
| `/ask-matt` | Router: qué skill/flujo aplica a tu situación. |
| `/grill-me` | Entrevista exigente para afinar un plan o diseño. |
| `/to-prd` · `/to-spec` | Convierte la conversación en un PRD / spec. |
| `/to-tickets` · `/to-issues` | Descompone un plan/spec en tickets tracer-bullet publicados en el tracker. |
| `/wayfinder` | Planifica un trabajo grande como un mapa de tickets de investigación. |

### Issue tracker

Los issues viven en **GitHub Issues** del repo (vía el `gh` CLI): un milestone + label por épica, más un GitHub Project. Los PRDs/ROADMAP por épica viven en `.scratch/`; los insumos de discovery en `docs/input/` (crearla cuando haga falta). Ver `docs/agents/issue-tracker.md`.

### Triage labels

Los cinco roles canónicos de triage (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) son labels de GitHub. Ver `docs/agents/triage-labels.md`.

### Domain docs

Single-context: un `CONTEXT.md` + `docs/adr/` en la raíz (creados por `/domain-modeling`). Ver `docs/agents/domain.md`.
