# Mapa de módulos de la API

Dueño de cada tabla y puertos entre módulos (`apps/api/.claude/rules/architecture.md`).
Todo módulo nuevo se registra acá antes o en el mismo PR que su implementación.

| Módulo | Tablas que posee | Exporta |
|---|---|---|
| `health` | — | — |
| `leads` | `leads` | — |
| `mobileAppVersions` | `mobile_app_versions` | — |
| `auth` | Ninguna propia. Lee `profiles` (Saba) y `auth.sessions` (GoTrue); lee y escribe `login_attempts` y `admin_login_lockouts` (compartidas con el login de staff de Saba) | `AuthGuard` global (`APP_GUARD`), `@CurrentUser()` |

## `auth`

- **Toda ruta exige sesión** salvo `@Public()`: `health`, `mobile-app-versions`, `auth/login` y `auth/refresh`.
- El guard verifica el JWT de Supabase Auth localmente (JWKS o HS256 legado) y, en una sola consulta, que la sesión siga viva en `auth.sessions` y que el perfil siga siendo staff y esté en `PANEL_ALLOWED_EMAILS` (`domain/panelAccess.ts`). Un logout o un rol quitado en Saba aplican en la petición siguiente.
- El login es un port de `loginAdmin` de Saba (`saba/services/auth/portalLogin.js`): Turnstile, rate limit por IP, bloqueo al quinto fallo consecutivo (se desbloquea desde `/admin/users` de Saba) y "sin acceso" revelado solo con la contraseña correcta.
- Las tablas de Saba y GoTrue se describen en `infrastructure/persistence/sabaAuthTables.ts`, que **no** se llama `*.schema.ts` para que `drizzle-kit` no genere migraciones de ellas. La copia local de las de login la crea `drizzle/0003_login_saba.sql` (no-op en Supabase).
