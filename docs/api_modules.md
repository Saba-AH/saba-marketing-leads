# Mapa de módulos de la API

Dueño de cada tabla y puertos entre módulos (`apps/api/.claude/rules/architecture.md`).
Todo módulo nuevo se registra acá antes o en el mismo PR que su implementación.

| Módulo | Tablas que posee | Exporta |
|---|---|---|
| `health` | — | — |
| `leads` | `leads` | — |
| `mobileAppVersions` | `mobile_app_versions` | — |
| `auth` | Ninguna propia. Lee `profiles` (Saba) y `auth.sessions` (GoTrue); lee y escribe `login_attempts` y `admin_login_lockouts` (compartidas con el login de staff de Saba) | `AuthGuard` global (`APP_GUARD`), `@CurrentUser()` |
| `whatsapp` | `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_webhook_events`, `whatsapp_accounts` | — |
| `sabaClientes` | Ninguna propia. Lee `profiles` y `applications` (Saba) | `SABA_CLIENTES_TOKENS.Reader` (`SabaClientesReaderPort`, catálogo de solo lectura) |

## `whatsapp`

- Chats de WhatsApp Cloud API (`.scratch/whatsapp-chats/PLAN.md`).
- `GET/POST /whatsapp/webhook` lo llama Meta: público, sin rate limit y fuera del sobre `{ success, data }`. El `POST` se autentica con `X-Hub-Signature-256` (HMAC del cuerpo crudo con `WHATSAPP_APP_SECRET`; por eso `main.ts` crea la app con `rawBody: true`), guarda cada `entry[].changes[]` en `whatsapp_webhook_events` y publica `WebhookEventoRecibido` por el `EventBus`. El procesamiento es aparte, para responder 200 rápido.
- Sin `WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN` la API arranca igual y el webhook responde 401/403.
- Procesamiento: `ProcesarWebhookEventoHandler` (al instante) y `ReprocesadorWebhookService` (al arrancar y cada 60 s, hasta 5 intentos por evento) llaman a `ProcesarWebhookEventoUseCase`, que aplica cada evento en una transacción y lo marca. Un contacto se identifica por `user_id` (BSUID) o teléfono.
- `saba_profile_id`, `tomada_por` y `enviado_por` guardan ids de `profiles` de Saba **sin FK**: la tabla es de otro sistema. Las lecturas de `profiles` y `applications` van a ir por un puerto de salida propio (`IClienteSabaReader`) que provee el módulo `sabaClientes`, no por consultas directas.

## `auth`

- **Toda ruta exige sesión** salvo `@Public()`: `health`, `mobile-app-versions`, `auth/login`, `auth/refresh` y `whatsapp/webhook`.
- El guard verifica el JWT de Supabase Auth localmente (JWKS o HS256 legado) y, en una sola consulta, que la sesión siga viva en `auth.sessions` y que el perfil siga siendo staff y esté en `PANEL_ALLOWED_EMAILS` (`domain/panelAccess.ts`). Un logout o un rol quitado en Saba aplican en la petición siguiente.
- El login es un port de `loginAdmin` de Saba (`saba/services/auth/portalLogin.js`): Turnstile, rate limit por IP, bloqueo al quinto fallo consecutivo (se desbloquea desde `/admin/users` de Saba) y "sin acceso" revelado solo con la contraseña correcta.
- Las tablas de Saba y GoTrue se describen en `infrastructure/persistence/sabaAuthTables.ts`, que **no** se llama `*.schema.ts` para que `drizzle-kit` no genere migraciones de ellas. La copia local de las de login la crea `drizzle/0003_login_saba.sql` (no-op en Supabase).
- Archivos de los mensajes: `GET /whatsapp/mensajes/:id/media` los pide a Meta en el momento (dos pasos con el token) y los pasa en stream, sin guardar copia. Solo tipos seguros se sirven `inline`; el resto como `attachment` con `CSP: sandbox`, porque el BFF los sirve en el mismo origen del panel.
- Vínculo con Saba: `whatsapp` declara `ClienteSabaReaderPort` y lo cumple `SabaClientesCandidatosAdapter` sobre el lector de `sabaClientes`. Se intenta **después** de confirmar la transacción del evento, en cada mensaje mientras el contacto no tenga vínculo, y nunca pisa uno existente.

## `sabaClientes`

- Catálogo de solo lectura sobre `profiles` y `applications` de Saba: sin casos de uso, exporta el lector (`buscarPorTelefono`, `obtenerResumen`, `buscar`).
- Las tablas se describen en `infrastructure/persistence/sabaClientesTables.ts`, que **no** se llama `*.schema.ts` para que `drizzle-kit` no genere migraciones de ellas.
- Teléfonos: Saba mezcla `+58 414…`, `0414…` y `414…`; se compara contra las tres formas (`variantesTelefono`). Solicitud activa = `approved`, `pending` o `date_scheduled`, igual que `ACTIVE_APP_STATUSES` de Saba.
