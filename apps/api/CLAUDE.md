# apps/api — NestJS API

NestJS + arquitectura hexagonal + DDD. Aplican las reglas de la raíz (`/CLAUDE.md`).

Esta app es **el único camino a los datos**: Postgres (Supabase local en desarrollo, Supabase en la nube) se alcanza solo desde acá, vía Drizzle. El cliente (Next.js SSR) llama a esta API por HTTP.

## Comandos

```bash
npx turbo typecheck --filter @repo/api
npx turbo lint --filter @repo/api        # arreglar: npm -C apps/api run lint:fix
npm -C apps/api test                     # vitest
npm run db:up                            # Supabase local (Postgres + Auth)
npm -C apps/api run db:generate          # migración nueva (+ escribir drizzle/down/<tag>.down.sql)
npm -C apps/api run db:migrate           # aplica migraciones sobre DATABASE
```

Nunca arranques el servidor ni hagas `curl` a endpoints locales por tu cuenta.

## Reglas detalladas (`.claude/rules/`)

Los estándares del backend viven por tema (se cargan por referencia):

@.claude/rules/architecture.md
@.claude/rules/persistence.md
@.claude/rules/web-layer.md
@.claude/rules/permissions.md
@.claude/rules/errors.md
@.claude/rules/nestjs-and-tests.md
@.claude/rules/english-naming.md

## Estado actual

- Módulos: `health` (sondas de dependencias), `leads` (referencia de CRUD con Drizzle, test unitario con repositorio fake y e2e contra Postgres real), `mobileAppVersions` y `auth` (login de staff contra Supabase Auth + `AuthGuard` global; ver `docs/api_modules.md`).
- Infra cableada: pool de Drizzle + agregador de esquema (`db-schema.ts`), migraciones con reversa obligatoria (`scripts/migrate.ts`, `scripts/rollback.ts`), throttling, filtros de errores de dominio/HTTP, logging estructurado con correlation id, Swagger desde Zod.
- `Dockerfile` con targets `runner` y `migrator`.

## Lo que todavía no existe

| Pieza | Estado |
|-------|--------|
| `PermissionsGuard`, `@RequirePermissions()` | pendiente |
| Interceptor global del sobre de respuesta | pendiente |
