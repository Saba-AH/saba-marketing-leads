# @repo/api — API

NestJS. **Único camino a los datos**: Postgres (Supabase local en desarrollo, Supabase en la nube) se alcanza solo desde aquí.

## Correr

Desde la raíz del monorepo (levanta también Postgres y el cliente):

```bash
npm run dev
```

Solo la API:

```bash
npm run db:up && npm run db:setup   # Supabase local, migraciones y seed
# El wrapper exporta las SUPABASE_* y DATABASE_LOCAL de `supabase status`:
node scripts/localSupabase.mjs exec npm run dev -w @repo/api
```

Requiere `apps/api/.env` (copiar de `.env.example`).

| Ruta | |
|------|--|
| `GET /api/v1/health` | Estado de la API y sus dependencias. `200` si todo está arriba, `503` si algo crítico falla. |
| `/api/docs` | Swagger |

## Comandos

| Comando | |
|---------|--|
| `npm test -w @repo/api` | Vitest |
| `npm run check:types -w @repo/api` | `tsc --noEmit` |
| `npm run build -w @repo/api` | `nest build` → `dist/` |

## Estructura

Hexagonal por módulo. `src/modules/health/` es la referencia mínima y completa:

```
src/modules/health/
├── domain/HealthReport.ts               # la regla: ok solo si toda dependencia está up
├── application/ports/{in,out}/          # CheckHealthPort · DependencyProbe · Clock
├── application/use-cases/               # CheckHealthUseCase
├── infrastructure/persistence/          # PostgresProbe (select 1)
├── infrastructure/time/                 # SystemClock
├── infrastructure/web/                  # HealthController + HealthPresenter
├── module.ts                            # cableado puertos → adaptadores
└── tokens.ts
```

Los esquemas del contrato viven en `packages/schemas`, compartidos con el cliente. Ver `apps/api/CLAUDE.md` para las convenciones completas.

## Despliegue

`Dockerfile` en la raíz de esta app: target `runner` (sirve `dist/main.js`) y target `migrator` (`npm run db:migrate` como job previo al deploy, contra Supabase).

## Pendiente en otros tickets

Esquema y migraciones, roles y el `AuthGuard` global de autenticación quedan para tickets futuros. El pool de Drizzle y `drizzle.config.ts` ya están cableados: falta el esquema.
