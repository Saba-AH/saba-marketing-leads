# @repo/api — API

NestJS. **Único camino a los datos**: su Postgres (Compose en local, una EC2 en dev/prod) y el servidor de Saba (login, sesiones, clientes) se alcanzan solo desde aquí.

## Correr

Desde la raíz del monorepo (levanta también Postgres y el cliente):

```bash
npm run dev
```

Solo la API:

```bash
npm run db:up && npm run db:migrate   # Postgres de docker-compose y migraciones
npm run dev -w @repo/api
```

Requiere `apps/api/.env` (copiar de `.env.example`), con `SABA_API_URL` y
`SABA_SERVICE_KEY` (el mismo valor que `MARKETING_SERVICE_KEY` de Saba): sin
ellas la API no arranca.

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

`Dockerfile` en la raíz de esta app: target `runner` (sirve `dist/main.js`) y target `migrator` (`npm run db:migrate` como job previo al deploy, contra el `DATABASE` del entorno).

## Auth

Global: toda ruta exige una sesión de Saba salvo `@Public()`, y
`@RequirePermissions()` exige permisos que resuelve Saba. Ver `docs/api_modules.md`.
