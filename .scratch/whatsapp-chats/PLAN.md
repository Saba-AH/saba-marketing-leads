# Plan de implementación — Chats de WhatsApp (Cloud API)

Épica: responder mensajes de WhatsApp de Saba desde `saba-marketing-leads`, sección **Chats**.
Decisiones cerradas en sesiones de grilling (2026-10-06 y 2026-10-07). Este documento es el plan; no hay código aún.

Reemplaza a `whatsapp-meta-v1.md` (envío suelto desde Configuración, escrito para el repo `saba`). De ese documento se rescatan el normalizador de teléfono, el filtro de plantillas, la extracción de variables y la tabla de errores en español.

## Alcance

**Fase 1 (este plan):** recibir y responder **texto** dentro de la ventana de 24 h, hilo por contacto, tomar/reasignar, vínculo con `profiles` de Saba, mensajes enviados desde el celular reflejados (coexistencia), historial de 180 días. **Iniciar y reabrir conversaciones con plantillas de solo texto** (`APPROVED`, variables solo en el cuerpo, pedidas en vivo a Meta).

**Fuera de alcance:** plantillas con medios en el encabezado o con botones con variables, envío masivo, archivos/imágenes (solo aviso), Messenger/Instagram, tiempo real por push (se usa polling), hosting de producción (pendiente).

## Decisiones que guían el diseño

| Tema | Decisión |
|---|---|
| Integración | WhatsApp Cloud API directa (Graph API, versión en `WHATSAPP_GRAPH_VERSION`), sin BSP |
| Número | Desarrollo con número de prueba de Meta; luego coexistencia vía Embedded Signup (probar en modo dev; si falla → Tech Provider tras verificación) |
| Ubicación | API en `apps/api` (NestJS, módulo hexagonal), UI en `apps/client` (`/chats`). `saba` no se toca |
| Base | Misma Postgres de Supabase; tablas nuevas `whatsapp_*` vía migraciones Drizzle de este repo |
| Hilo | 1 conversación por contacto; `resuelta` → `abierta` al llegar mensaje nuevo |
| Asignación | "Tomar" chat (`tomada_por`); otros pueden intervenir; reasignar con permiso |
| Ventana 24 h | Solo la abren mensajes **entrantes en vivo** del cliente (no historial, no ecos del celular). Cerrada → compositor bloqueado + contador |
| No-texto | Burbuja de aviso ("📷 Imagen recibida — ver en el celular") con caption; se guarda `tipo` y `media_id` |
| Vínculo Saba | `regexp_replace(profiles.telefono,'\D','','g') = wa_id`; varios → sugerir el de solicitud activa más reciente, el agente puede corregir (`vinculo_origen='manual'`) |
| Login | **Hecho** (rama `feat/auth-admin`): port del login de staff de Saba a `modules/auth`, BFF en Next con cookies `httpOnly`, `/login`. Ver `docs/api_modules.md` |
| Permisos | Claves de permisos v2: `whatsapp_chats.view`, `.reply`, `.start`, `.take`, `.reassign`, `whatsapp.configure`. `.start` = nuevo chat y reabrir con plantilla (cuesta dinero y afecta la calidad del número), separado de `.reply`. `PermissionsGuard` + `@RequirePermissions`. Fase 1: resolver por constante (`angel.hernandez@sabatransporte.com` → todos); después adaptador `has_permission_v2` |
| Refresco UI | Polling React Query: hilo abierto 3 s, lista 10–15 s |
| Secretos | `.env`; `whatsapp_accounts` solo guarda estado de conexión |
| Plantillas | Fase 1: solo texto, variables solo en el cuerpo; lista en vivo de Meta (`APPROVED`) con caché de 60 s invalidada por `message_template_status_update`. Se crean en WhatsApp Manager, no en Saba |
| Configuración | Pantalla de solo lectura `/chats/configuracion` (`whatsapp.configure`): conectado / no configurado, número, token válido, último webhook recibido, botón "Enviar mensaje de prueba". La misma pantalla recibe el Embedded Signup en la Fase 9 |
| Túnel dev | `cloudflared` con nombre en `wa-dev.sabatransporte.com` (DNS de Saba en Cloudflare) |
| Meta apps | Una sola app; callback override por WABA (prueba → túnel, real → prod) |

## Variables de entorno nuevas (`apps/api/.env.example`)

```
# SUPABASE_* y TURNSTILE_SECRET_KEY ya existen (auth, ver apps/api/.env.example)
WHATSAPP_GRAPH_VERSION=v25.0      # la que mostró el panel de Meta el 2026-10-07; verificar la vigente al implementar
WHATSAPP_ACCESS_TOKEN=            # token de usuario del sistema (sin vencimiento)
WHATSAPP_APP_SECRET=              # firma X-Hub-Signature-256
WHATSAPP_VERIFY_TOKEN=            # handshake GET del webhook
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
WHATSAPP_APP_ID=                  # fase coexistencia (Embedded Signup)
WHATSAPP_ES_CONFIG_ID=            # fase coexistencia
```

Cliente: `NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_WHATSAPP_ES_CONFIG_ID` (fase coexistencia).

## Mapa de módulos (registrar en `docs/api_modules.md`, que hoy no existe — crearlo)

| Módulo | Tablas que posee | Exporta |
|---|---|---|
| `auth` | — | `SupabaseJwtGuard` (global), `PermissionsGuard` (global), `@RequirePermissions`, `@CurrentPermissions`, `@CurrentUser`, `PermissionsResolverPort` |
| `whatsapp` | `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_webhook_events`, `whatsapp_accounts` | nada en fase 1 |
| `sabaClientes` (catálogo de solo lectura) | ninguna propia; lee `profiles`, `applications` (tablas de Saba) | `SabaClienteReaderPort` (fachada) |

`whatsapp` declara en su `application/ports/out/` un `IClienteSabaReader`; `sabaClientes` provee el adaptador. Así ninguna consulta a tablas de Saba queda dispersa en el módulo de WhatsApp.

---

## Fase 0 — Preparación en Meta (la hace el usuario, en paralelo)

**Hecho (2026-10-07):**
- App **Saba-Chat** (ID `2332812997518690`), modo desarrollo, en el portafolio **Saba Global Services LLC** (no en "Prueba", que tiene las apps viejas).
- Número de prueba `+1 555 634 6598` · `WHATSAPP_PHONE_NUMBER_ID=1014761568397246` · `WHATSAPP_WABA_ID=1293126782760816`.
- `hello_world` entregado a un celular agregado como destinatario.
- Verificación del negocio iniciada (con documentos de la LLC).

**Pendiente:**
1. business.facebook.com → Usuarios del sistema → `saba-chat-api` (Admin); asignar Saba-Chat + WABA de prueba con control total; token sin vencimiento con `whatsapp_business_messaging` y `whatsapp_business_management` (`business_management` recién en la Fase 9).
2. Saba-Chat → Configuración de la app → Básica → clave secreta → `WHATSAPP_APP_SECRET`. Generar `WHATSAPP_VERIFY_TOKEN` (`openssl rand -hex 32`).
3. `.env` con los nombres de esta sección (`WHATSAPP_PHONE_NUMBER_ID`, no `PHONE_NUMBER_ID`). Aclarar qué era `WHATSAPP_IDENTITY_PROVIDER_ID`.
4. WhatsApp Manager, en la WABA de prueba: plantillas `seguimiento_solicitud` (UTILITY) y `contacto_lead` (MARKETING), idioma `es`, solo texto, `{{1}}` = nombre, con ejemplo de variable.
5. Túnel con nombre `wa-dev.sabatransporte.com` → API local.

## Fase 1 — Auth y permisos (API + cliente)

**Auth: hecha** fuera de este plan (sesión de grilling del 2026-10-06, rama `feat/auth-admin`). Difiere de lo que se planeó acá:

- El login **no** usa supabase-js en el navegador (lo prohíbe el `CLAUDE.md`): `POST /api/v1/auth/login` en la API, portado de `loginAdmin` de Saba (Turnstile, rate limit por IP, bloqueo al 5º fallo en las tablas compartidas `login_attempts`/`admin_login_lockouts`).
- El cliente es un BFF: tokens en cookies `httpOnly`, `src/middleware.ts` exige y renueva la sesión, `/api/backend/*` reenvía a la API. No hay `NEXT_PUBLIC_SUPABASE_*`.
- `AuthGuard` global (no `SupabaseJwtGuard`): JWT verificado local (JWKS o HS256 legado) + una consulta a `auth.sessions` y `profiles` por petición. Acceso al panel: rol staff **y** `PANEL_ALLOWED_EMAILS` (`modules/auth/domain/panelAccess.ts`), ya no `CHATS_ALLOWED_EMAILS`.
- `GET /api/v1/me` devuelve `{ id, correo, nombre, rol }`, **sin permisos**.

**Pendiente para Chats — permisos (antes 1.3):** catálogo cerrado (`whatsapp_chats.view|reply|start|take|reassign`, `whatsapp.configure`), `PermissionsResolverPort` (por constante primero, `has_permission_v2` después), `PermissionsGuard` + `@RequirePermissions`, `@CurrentPermissions()`, y sumar `permisos` a `/me`. En el cliente, `usePermisos()` sobre `/me` y pantalla "Sin acceso" ante 403.

## Fase 2 — Esquema y migración

**2.1** `modules/whatsapp/infrastructure/persistence/whatsapp.schema.ts` con las 5 tablas (ver abajo) + `relations()`; reexportar en `infrastructure/database/db-schema.ts`.

**2.2** `npm -C apps/api run db:generate` → `drizzle/00NN_whatsapp_chats.sql` + `drizzle/down/00NN_whatsapp_chats.down.sql` (a mano). Aplicar local; en Supabase lo aplica el usuario con `db:migrate:supabase`.

```
whatsapp_contacts
  id uuid PK default gen_random_uuid()
  wa_id text NOT NULL UNIQUE                       -- solo dígitos
  profile_name text
  saba_profile_id uuid NULL                        -- profiles.id (sin FK: tabla de otro sistema)
  vinculo_origen text NULL CHECK in ('auto','manual')
  created_at, updated_at timestamptz NOT NULL default now()

whatsapp_conversations
  id uuid PK
  contact_id uuid NOT NULL UNIQUE → whatsapp_contacts ON DELETE CASCADE
  estado text NOT NULL default 'abierta' CHECK in ('abierta','resuelta')
  tomada_por uuid NULL, tomada_at timestamptz NULL
  ultimo_mensaje_at timestamptz NULL
  ultimo_entrante_at timestamptz NULL             -- ventana 24h = +24h
  ultimo_mensaje_preview text NULL                 -- para la lista sin join
  no_leidos int NOT NULL default 0
  created_at, updated_at
  INDEX (estado, ultimo_mensaje_at DESC), INDEX (tomada_por)

whatsapp_messages
  id uuid PK
  conversation_id uuid NOT NULL → whatsapp_conversations ON DELETE CASCADE
  wamid text NULL UNIQUE                           -- NULL mientras está 'pendiente'
  direccion text NOT NULL CHECK in ('entrante','saliente')
  origen text NOT NULL CHECK in ('cliente','sistema','celular','historial')
  tipo text NOT NULL                               -- text, image, audio, sticker, location, ...
  cuerpo text NULL
  media_id text NULL
  enviado_por uuid NULL
  estado text NULL CHECK in ('pendiente','enviado','entregado','leido','fallido')  -- solo salientes
  error_codigo text NULL, error_detalle text NULL
  plantilla_nombre text NULL, plantilla_idioma text NULL, plantilla_categoria text NULL  -- solo si tipo = 'template'; cuerpo = texto con variables ya reemplazadas
  wa_timestamp timestamptz NOT NULL
  created_at
  INDEX (conversation_id, wa_timestamp DESC)

whatsapp_webhook_events
  id uuid PK
  campo text NOT NULL                              -- messages, smb_message_echoes, history, account_update, smb_app_state_sync
  payload jsonb NOT NULL
  recibido_at timestamptz NOT NULL default now()
  procesado_at timestamptz NULL
  intentos int NOT NULL default 0
  error text NULL
  INDEX parcial (recibido_at) WHERE procesado_at IS NULL

whatsapp_accounts
  id uuid PK
  waba_id text NOT NULL, phone_number_id text NOT NULL UNIQUE, display_phone text
  estado text NOT NULL CHECK in ('conectado','desconectado')
  motivo_desconexion text NULL
  historial_solicitado_at timestamptz NULL, contactos_solicitados_at timestamptz NULL
  actualizado_at timestamptz NOT NULL default now()
```

Agregar al glosario de `CONTEXT.md`: Contacto, Conversación, Ventana de atención (24 h), Eco (mensaje enviado desde el celular), Tomar chat.

## Fase 3 — Webhook: recepción

**3.1** `main.ts`: `NestFactory.create(AppModule, { bufferLogs: true, rawBody: true })`. Excluir la ruta del webhook del throttler global (Meta reintenta en ráfagas).

**3.2** `WhatsAppWebhookController` (`@Public()`):
- `GET /api/v1/whatsapp/webhook`: `hub.mode=subscribe` y `hub.verify_token === WHATSAPP_VERIFY_TOKEN` → 200 con `hub.challenge` en texto plano; si no → 403.
- `POST /api/v1/whatsapp/webhook`: verificar `X-Hub-Signature-256` = HMAC-SHA256(rawBody, APP_SECRET) con `timingSafeEqual` → 401 si no coincide. Por cada `entry[].changes[]` insertar una fila en `whatsapp_webhook_events` (`campo`, `payload = change.value`), publicar `WebhookEventoRecibido` por el EventBus y responder **200 de inmediato**.
- Sin Zod estricto sobre el payload entrante (Meta agrega campos); se valida en el procesador.

**3.3** Logs: redactar el payload (teléfonos y texto) en `StructuredLogger`.

**Tests:** handshake correcto/incorrecto; firma válida/inválida/ausente; payload con 2 `changes` → 2 filas; respuesta 200 aunque el procesador falle.

## Fase 4 — Webhook: procesamiento

**4.1** `ProcesarWebhookEventoUseCase` (handler del evento + barrido): toma el evento, despacha por `campo`, marca `procesado_at` o incrementa `intentos` + `error`. Idempotente: todo upsert por `wamid`.

**4.2** `ReprocesadorWebhookService` (`OnModuleInit`): al arrancar y cada 60 s procesa filas con `procesado_at IS NULL AND intentos < 5` (`FOR UPDATE SKIP LOCKED` para múltiples instancias).

**4.3** Handlers por campo:
- `messages` → `value.messages[]`: upsert contacto (`wa_id`, `profile_name` de `value.contacts[]`); upsert conversación; insertar mensaje `entrante/cliente`; actualizar `ultimo_entrante_at`, `ultimo_mensaje_at`, preview, `no_leidos++`; si estaba `resuelta` → `abierta`. Tipos no-texto: `cuerpo = caption`, `media_id`. `reaction`/`unsupported`: guardar como tipo, sin preview.
- `messages` → `value.statuses[]`: actualizar `estado` del mensaje por `wamid` (no retroceder: leído > entregado > enviado); `failed` → `error_codigo/detalle` (incluye errores de pago/límite).
- `smb_message_echoes` → `value.message_echoes[]`: mensaje `saliente/celular`, contacto = `to`; **no** toca `ultimo_entrante_at`.
- `history` → hilos con mensajes de fases 0/1/2: insertar `origen='historial'` (dirección según `from`), no toca ventana, no suma `no_leidos`; `ON CONFLICT (wamid) DO NOTHING`. Procesar en lotes (puede traer miles).
- `account_update` → `PARTNER_REMOVED` / `ACCOUNT_OFFBOARDED` → `whatsapp_accounts.estado='desconectado'` + motivo; `ACCOUNT_RECONNECTED` → `conectado`.
- `smb_app_state_sync` → actualizar `profile_name` del contacto si viene; resto se ignora en fase 1.
- `message_template_status_update` → invalidar la caché de plantillas (no se persiste nada más).

**4.4** Vínculo con Saba al **crear** un contacto: `IClienteSabaReader.buscarPorWaId(waId)` → lista de perfiles candidatos ordenados (solicitud activa más reciente primero); se fija el primero con `vinculo_origen='auto'`. No se recalcula si es `manual`.

**Tests (con fixtures JSON reales de Meta en `test/fixtures/whatsapp/`):** texto entrante crea contacto+conversación+mensaje; duplicado no duplica; status fuera de orden; eco no abre ventana; historial no abre ventana ni suma no leídos; resuelta → abierta; imagen guarda caption y media_id; account_update cambia estado.

## Fase 5 — Módulo `sabaClientes` (solo lectura)

**5.1** Esquema Drizzle mínimo de solo lectura para `profiles` (id, nombre, telefono, role) y `applications` (id, user_id, status, created_at) — solo columnas usadas; **no** generan migración (excluir del `drizzle.config` o declararlas fuera del agregador de migraciones; resolver en la tarea).

**5.2** `SabaClienteReaderAdapter`:
- `buscarPorWaId(waId)`: `WHERE regexp_replace(telefono,'\D','','g') = $1` (33 k filas: seq scan aceptable; se cachea en `whatsapp_contacts`), con la solicitud más reciente por perfil (`LATERAL`), orden: activa primero, luego `created_at DESC`.
- `obtenerResumen(profileId)`: nombre, teléfono, solicitudes (id, estado, fecha) para el panel lateral.
- `buscar(texto)`: para vincular manualmente (nombre/cédula/teléfono), limitado a 20.

**Tests:** con datos sembrados en la base de test: 0, 1 y N coincidencias; formato `+58…` y `58…`.

## Fase 6 — Envío y acciones (API)

**6.1** `WhatsAppCloudPort` (out) + `GraphWhatsAppCloudAdapter` (`fetch` a `https://graph.facebook.com/{v}/{PHONE_NUMBER_ID}/messages`, `{ messaging_product:'whatsapp', to, type:'text', text:{ body, preview_url:false } }`). Mapear errores de Graph a excepciones de dominio con mensaje en español (tabla de `whatsapp-meta-v1.md` §6.1: 131047, 131030, 131026, 132000, 132001, 100, 190, 131056/130429/80007). El puerto también expone `sendTemplate(to, nombre, idioma, variables)` y `listApprovedTemplates()`.

**6.1b** Plantillas: `GET /{WABA_ID}/message_templates?status=APPROVED&fields=name,language,status,category,parameter_format,components` siguiendo `paging.next`. Soportada = tiene `BODY`; `HEADER` solo `TEXT` sin variables; botones sin parámetros (`QUICK_REPLY`, `PHONE_NUMBER`, `URL` fija). Variables del cuerpo con `/\{\{\s*(\w+)\s*\}\}/g` sin repetir; `POSITIONAL` o `NAMED` (con `parameter_name`). Caché en memoria 60 s. Validación: todas las variables no vacías, ≤ 1024 caracteres, sin saltos de línea ni tabs.

**6.1c** `normalizeWhatsAppPhone(input): string | null` en **`packages/utils`** (lo usan las dos apps): solo dígitos, quita `00`, `0`+10 dígitos → `58`+10, 10 dígitos que empiezan con `4` → `58`+número, válido entre 10 y 15 dígitos. Tests con la tabla de `whatsapp-meta-v1.md` §7.

**6.2** `ResponderConversacionUseCase` (`whatsapp_chats.reply`):
- Rechaza si la ventana está cerrada (`VentanaCerradaException` → 409).
- Si nadie la tomó, la toma quien responde.
- Inserta mensaje `saliente/sistema/pendiente`, llama a Meta, guarda `wamid` y `estado='enviado'`; en error → `fallido` + detalle (el mensaje queda visible con "reintentar").
- Límite de 4096 caracteres (Zod).

**6.2b** `IniciarConversacionUseCase` (`whatsapp_chats.start`): normaliza el teléfono, upsert de contacto y conversación (vínculo con Saba como en 4.4), envía la plantilla y guarda el mensaje `saliente/sistema` con `tipo='template'`, `plantilla_*` y el cuerpo ya renderizado. No abre la ventana (solo la abre el cliente al responder). `ReabrirConPlantillaUseCase` hace lo mismo sobre una conversación existente.

**6.3** Endpoints (`packages/schemas/src/whatsapp/` primero, luego controller y `packages/services/src/components/whatsapp.ts`):

| Método y ruta | Permiso | Notas |
|---|---|---|
| `GET /whatsapp/conversaciones` | `whatsapp_chats.view` | filtros: estado, `mias`, `sin_tomar`, `sin_vincular`, búsqueda por nombre/número; paginado; incluye contacto, vínculo resumido, `ventana_expira_at` |
| `GET /whatsapp/conversaciones/:id` | `.view` | cabecera + contacto + vínculo |
| `GET /whatsapp/conversaciones/:id/mensajes` | `.view` | cursor por `wa_timestamp`, más recientes primero |
| `POST /whatsapp/conversaciones/:id/mensajes` | `.reply` | `{ cuerpo }` |
| `POST /whatsapp/mensajes/:id/reintentar` | `.reply` | solo `fallido` y ventana abierta |
| `POST /whatsapp/conversaciones/:id/tomar` | `.take` | |
| `POST /whatsapp/conversaciones/:id/liberar` | `.take` | solo quien la tiene, o con `.reassign` |
| `POST /whatsapp/conversaciones/:id/reasignar` | `.reassign` | `{ userId }` |
| `POST /whatsapp/conversaciones/:id/resolver` · `/reabrir` | `.reply` | |
| `POST /whatsapp/conversaciones/:id/leida` | `.view` | `no_leidos = 0` (y opcional mark-as-read en Meta) |
| `GET /whatsapp/contactos/:id/candidatos-saba` · `GET /saba-clientes?q=` | `.view` | |
| `PUT /whatsapp/contactos/:id/vinculo` | `.reply` | `{ sabaProfileId \| null }` → `manual` |
| `GET /whatsapp/cuenta` | `.view` | estado de conexión para el banner |
| `GET /whatsapp/plantillas` | `.start` | plantillas soportadas: `{ name, language, category, parameterFormat, bodyText, variables }` |
| `POST /whatsapp/conversaciones` | `.start` | `{ telefono, plantilla, idioma, variables }` → nuevo chat |
| `POST /whatsapp/conversaciones/:id/plantilla` | `.start` | `{ plantilla, idioma, variables }` → reabrir con ventana cerrada |
| `GET /whatsapp/configuracion` | `whatsapp.configure` | configurado, número, token válido (consulta a Meta), último webhook recibido |
| `POST /whatsapp/configuracion/prueba` | `whatsapp.configure` | envío de prueba (texto o plantilla) a un número; no crea conversación |
| `GET /me/permissions` | autenticado | (fase 1) |

Nombres de quién tomó/envió: resolver `tomada_por`/`enviado_por` contra `profiles` vía `sabaClientes` (o devolver email desde `auth.users`) — decidir en la tarea; la UI solo necesita un nombre.

## Fase 7 — UI `/chats` (cliente)

`src/features/chats/{domain,application/{queries,mutations},infrastructure,ui/{components,pages,widgets}}` siguiendo `features/leads`; ruta `src/app/(app)/chats/page.tsx`; link "Chats" en `(app)/layout.tsx` visible solo con `whatsapp_chats.view`.

- **Lista (izquierda):** pestañas Abiertas / Mías / Sin tomar / Resueltas; nombre (Saba > perfil WA > número), preview, hora, badge no leídos, avatar de quién la tomó, indicador "sin vincular". Polling 10–15 s.
- **Hilo (centro):** burbujas entrantes/salientes; etiqueta "desde el celular" en ecos y "historial" en importados; aviso para no-texto; ticks de estado; "fallido — reintentar". Polling 3 s; scroll infinito hacia arriba; al abrir → `leida`.
- **Compositor:** si la ventana está cerrada, bloqueado con botón **"Reabrir con plantilla"** (con `.start`); contador "Ventana: 5 h 12 min" cuando está abierta; envío optimista.
- **Cabecera:** Tomar / Liberar / Reasignar / Resolver según permisos.
- **Panel derecho (Saba):** perfil vinculado + solicitudes; "Hay N perfiles con este número" → elegir; "Contacto sin vincular" → buscador para vincular.
- **Banner global:** WhatsApp desconectado (desde `/whatsapp/cuenta`) con motivo.
- **Nuevo chat** (con `.start`): teléfono con vista previa normalizada ("Se enviará a +58 414 …" / "Número inválido"), selector `nombre · idioma · categoría`, un input por variable, vista previa del cuerpo en vivo. Sin plantillas soportadas: "No hay plantillas aprobadas de solo texto. Créalas en WhatsApp Manager."
- **`/chats/configuracion`** (con `whatsapp.configure`): estado de la sección de Decisiones + "Enviar mensaje de prueba".

**Tests:** Jest + MSW: lista, compositor bloqueado/abierto, envío fallido + reintento, vínculo manual, nuevo chat con plantilla (variables y vista previa), reabrir con plantilla.

## Fase 8 — Prueba de punta a punta con número de prueba

1. API local + túnel con nombre `wa-dev.sabatransporte.com`.
2. Meta → WhatsApp → Configuración → Webhook: `https://wa-dev.sabatransporte.com/api/v1/whatsapp/webhook` + `WHATSAPP_VERIFY_TOKEN`; suscribir `messages`, `account_update`, `history`, `smb_message_echoes`, `smb_app_state_sync`, `message_template_status_update`.
3. Script `apps/api/scripts/whatsapp/suscribirApp.ts` → `POST /{WABA_ID}/subscribed_apps`.
4. Escribir desde el celular → ver chat → responder → ver ticks → esperar >24 h y confirmar bloqueo.
5. Nuevo chat con `seguimiento_solicitud` a un destinatario permitido → llega; responder desde el celular → se abre la ventana.
6. Reabrir con plantilla una conversación vencida; destinatario no permitido → error 131030 en español; `/chats/configuracion` muestra estado y último webhook.

## Fase 9 — Conexión del número real (coexistencia)

**9.1** Meta: Facebook Login for Business → Configuración "WhatsApp Embedded Signup" → `config_id`. Dominio del cliente en "Allowed domains" (necesita HTTPS → depende de hosting o túnel del cliente).

**9.2** Cliente: pantalla `/chats/configuracion` (`whatsapp.configure`) con el SDK JS de Facebook:
`FB.login(cb, { config_id, response_type:'code', override_default_response_type:true, extras:{ setup:{}, featureType:'whatsapp_business_app_onboarding', sessionInfoVersion:'3' } })`; escuchar `message` de `facebook.com` → `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` con `waba_id`, `phone_number_id`.

**9.3** API `POST /whatsapp/conexion` (`whatsapp.configure`) — en < 30 s:
1. `GET /oauth/access_token?client_id&client_secret&code` → token de negocio (mostrarlo una vez / guardarlo en `.env` a mano; **no** en base).
2. `POST /{WABA_ID}/subscribed_apps`.
3. **No** llamar `/register`.
4. `GET /{PHONE_NUMBER_ID}?fields=is_on_biz_app,platform_type` → verificar.
5. Upsert `whatsapp_accounts` (`conectado`).
6. `POST /{PHONE_NUMBER_ID}/smb_app_data` `sync_type=smb_app_state_sync`, luego `sync_type=history` (**dentro de 24 h, una sola vez**; registrar `*_solicitado_at`).

**9.4** Si en modo desarrollo no funciona: tras aprobar la verificación → App Review + acceso avanzado de `whatsapp_business_messaging`/`whatsapp_business_management` → Tech Provider → repetir 9.2–9.3. Si eso también se traba → plan B: número nuevo solo-API (registro normal con `/register`, el código no cambia).

## Fase 10 — Producción (pendiente de decisiones)

- [ ] Hosting de `apps/api` y `apps/client` con URL HTTPS fija (Cloud Run con CPU siempre asignada y mín. 1 instancia, o servidor Ubuntu + pm2).
- [ ] Callback override del WABA real → URL de prod.
- [ ] Tarjeta internacional en Billing Hub (sin método de pago Meta corta en 1 000 respuestas/mes y no se envían plantillas). **Por confirmar** si la LLC tiene una.
- [ ] Recrear las plantillas en la WABA real (pertenecen a la WABA; las de prueba no se trasladan).
- [ ] Verificación del negocio aprobada.
- [ ] Celular de la empresa abierto al menos cada ~14 días (si no, `PRIMARY_INACTIVITY` desconecta).

## Orden sugerido y dependencias

```
Fase 0 (Meta, usuario) ─────────────────────────────┐
Fase 1 auth ─┐                                       │
Fase 2 esquema ─┬─ Fase 3 recepción ─ Fase 4 procesamiento ─┐
                └─ Fase 5 sabaClientes ─────────────────────┼─ Fase 6 envío/API ─ Fase 7 UI ─ Fase 8 E2E ─ Fase 9 coexistencia ─ Fase 10 prod
```

Fases 1, 2 y 5 pueden ir en paralelo. Cada fase es un PR (el usuario commitea y despliega).

## Riesgos abiertos

- Coexistencia sin ser Tech Provider no está documentada: puede requerir esperar la verificación.
- Mensajes recibidos justo antes de conectar no abren ventana: solo se podrán contestar con plantilla.
- Meta puede reclasificar una plantilla UTILITY como MARKETING (más cara) o rechazarla si el texto suena promocional.
- Algunos errores (131047, 131026) llegan solo por webhook de estado, no en la respuesta del envío: el mensaje se ve "enviado" y luego pasa a `fallido`.
- El historial llega en lotes grandes: vigilar tamaño de `whatsapp_webhook_events.payload` y tiempo de procesamiento.
- `has_permission_v2` todavía no existe: el resolver por constante se reemplaza cuando se aplique permisos v2.
- Precios: respuestas gratis hasta 1 000/mes por número desde 2026-10-01; luego se cobran.
