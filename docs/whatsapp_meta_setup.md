# WhatsApp Cloud API — configuración en Meta, paso a paso

Guía para dejar funcionando los **Chats de WhatsApp** de `saba-marketing-leads` del lado de Meta: qué se hace en **Meta Business** (business.facebook.com), qué en **Meta for Developers** (developers.facebook.com) y cómo se unen la app con el negocio.

Sirve para repetir la configuración desde cero (otro entorno, el número real de producción) y como registro de lo que ya está hecho. El plan técnico de la épica está en `.scratch/whatsapp-chats/PLAN.md`; el código, en `apps/api/src/modules/whatsapp/`.

> Meta cambia los nombres y la ubicación de sus menús con frecuencia. Si un botón no está donde dice esta guía, buscar por el nombre del concepto (por ejemplo "Usuarios del sistema" o "Webhook").

---

## 0. Conceptos: qué es cada cosa

En Meta no existe un "login de empresa". Hay piezas separadas que se conectan entre sí:

```
Cuenta personal de Facebook (tú)              ← identidad: con ella entras a todo
│
└── Portafolio comercial: Saba Global Services LLC   ← la EMPRESA (verificación, pagos, dueño de todo)
    │
    ├── App: Saba-Chat                              ← la "llave" con la que nuestro código habla con Meta
    │
    ├── WABA (cuenta de WhatsApp Business)          ← la "carpeta" de WhatsApp de la empresa
    │   ├── Número de teléfono                      ← por donde entran y salen los mensajes
    │   └── Plantillas                              ← mensajes pre-aprobados para iniciar conversaciones
    │
    └── Usuario del sistema: saba-chat-api          ← un "empleado robot" del portafolio
        └── Token permanente                        ← lo que va en el .env de la API
```

| Término | Qué es | Dónde se ve |
|---|---|---|
| **Portafolio comercial** (Business portfolio) | La empresa en Meta. Es **dueño** de la app, la WABA, el número y la facturación. Se verifica con documentos legales. | business.facebook.com |
| **App** | Lo que nuestro código usa para autenticarse ante la Graph API. La **crea una persona**, pero **pertenece a un portafolio**. | developers.facebook.com → Mis apps |
| **WABA** (WhatsApp Business Account) | Cuenta de WhatsApp de la empresa. Contiene números y plantillas. Nada que ver con "Saba": es una sigla de Meta. | WhatsApp Manager / Configuración del negocio → Cuentas de WhatsApp |
| **Phone Number ID** | ID interno del número. La API **envía usando este ID**, no el número visible. | Developers → WhatsApp → Configuración de la API |
| **Usuario del sistema** | Usuario del portafolio que no es una persona. Su token **no vence** y no depende de que alguien siga en la empresa. | business.facebook.com → Usuarios → Usuarios del sistema |
| **Webhook** | URL de nuestra API a la que Meta avisa cada mensaje entrante y cada cambio de estado. | Developers → WhatsApp → Configuración |

**Regla de oro:** todo (app, WABA, número, usuario del sistema) tiene que estar en el **mismo portafolio**. Un usuario del sistema solo puede recibir activos de su propio portafolio.

---

## 1. Requisitos antes de empezar

1. **Cuenta personal de Facebook** con acceso al portafolio **Saba Global Services LLC** con rol **Control total** (no "Acceso básico": con acceso básico no aparecen "Usuarios del sistema" ni la asignación de activos).
   - Para revisarlo: business.facebook.com → elegir el portafolio → ⚙️ Configuración → **Usuarios → Personas** → buscar tu correo.
2. **Verificación del negocio** iniciada (no bloquea el desarrollo con número de prueba, sí la producción):
   - business.facebook.com → Configuración → **Centro de seguridad** (o *Información del negocio*) → **Verificación del negocio**.
   - Se verifica con los documentos de la **LLC** (EIN, Articles of Organization), un dominio/sitio con el mismo nombre y un teléfono o correo de ese dominio. Tarda días o semanas: iniciarla cuanto antes.
3. **No cambiar el nombre del portafolio** mientras la verificación está en revisión: tiene que coincidir con los documentos.

---

## 2. Developers: crear la app

> Hecho el 2026-10-07: app **Saba-Chat**, ID `2332812997518690`.

1. Entrar a **developers.facebook.com → Mis apps → Crear app**, con tu cuenta personal (no hay otra forma; quedas como administrador de la app).
2. **Nombre:** `Saba-Chat` (o el que corresponda al entorno). Correo de contacto: uno de `@sabatransporte.com`.
3. **Caso de uso:** **"Conectar con clientes a través de WhatsApp"**. Si no aparece, elegir *Otro* → tipo **Business**.
4. **Portafolio comercial: elegir `Saba Global Services LLC`.** ⚠️ Es el paso que decide de quién es la app. En *Mis apps* la tarjeta debe decir "Negocio: Saba Global Services LLC".
   - Error que ya pasó: las apps viejas (SabaTest, Saba motos, PruebaWhasaapp) quedaron en un portafolio llamado "Prueba". Una app en otro portafolio **no** se puede usar con el usuario del sistema de Saba.
5. **Crear.** La app queda en **modo desarrollo**: para usar la Cloud API con la WABA propia de la empresa **no hace falta** pasarla a "Live" ni hacer App Review (eso solo aplica si después se quiere ser Tech Provider para la coexistencia).

**Por qué una app nueva y no reutilizar una existente:** su clave secreta firma los webhooks (rotarla rompería otras integraciones), los permisos quedan aislados y no se arrastran restricciones de apps viejas.

---

## 3. Developers: número de prueba y primeros IDs

> Hecho el 2026-10-07: número de prueba `+1 555 634 6598`.

1. En el panel de **Saba-Chat** → **Casos de uso** → "Conectar en WhatsApp" → **Personalizar** → **Paso 1: Pruébalo** (en el menú clásico: **WhatsApp → Configuración de la API**).
2. Si pide crear o elegir una cuenta de WhatsApp Business, elegir el portafolio **Saba Global Services LLC**. Meta crea sola una **WABA de prueba** con un **número de prueba** (`+1 555 …`).
3. **Anotar** (son IDs, no secretos):

   | En pantalla | Variable | Valor actual (prueba) |
   |---|---|---|
   | Phone Number ID | `WHATSAPP_PHONE_NUMBER_ID` | `1014761568397246` |
   | Identificador de la cuenta de WhatsApp Business | `WHATSAPP_WABA_ID` | `1293126782760816` |

4. **Destinatarios autorizados:** en el campo **Destinatario → Administrar lista de números de teléfono → Agregar**. Llega un código por WhatsApp a ese número y se confirma en Meta. Máximo **5**.
   - ⚠️ Con el número de prueba, **solo se puede enviar a estos números**. Cualquiera puede escribirle al número de prueba, pero responderle a alguien fuera de la lista da el error **131030** ("Número de teléfono del destinatario no incluido en la lista de autorizados"). Ya pasó: se escribió desde un número distinto al autorizado.
5. **Prueba rápida:** con el **token temporal** de esa pantalla, botón **Enviar mensaje** → llega la plantilla `hello_world` al celular autorizado.
   - El token temporal **vence en 24 h**: no va al `.env`. El permanente sale del paso 4.
   - El `curl` de ejemplo muestra la versión de la Graph API; los campos del webhook (paso 7) muestran la vigente. Hoy: **v26.0**.

---

## 4. Business: usuario del sistema y token permanente (la unión app ↔ negocio)

Este es el paso que **une la app con el portafolio**: un usuario del sistema del portafolio recibe como activos la app y la WABA, y con eso genera un token que puede usar los dos.

1. **business.facebook.com** → elegir **Saba Global Services LLC** → ⚙️ **Configuración del negocio**.
2. **Usuarios → Usuarios del sistema → Agregar**:
   - Nombre: `saba-chat-api`
   - Rol: **Administrador**
3. Con `saba-chat-api` seleccionado → **Asignar activos**:
   - **Apps → Saba-Chat → Control total.**
   - **Cuentas de WhatsApp → la WABA** (la de prueba ahora; la real en producción) **→ Control total.**
4. **Generar token**:
   - App: **Saba-Chat**
   - Caducidad: **Nunca**
   - Permisos: `whatsapp_business_messaging` y `whatsapp_business_management`. (`business_management` solo hará falta para la coexistencia.)
5. **Copiar el token en ese momento**: Meta no lo vuelve a mostrar. Guardarlo en el gestor de contraseñas y en `WHATSAPP_ACCESS_TOKEN`.

**Cómo comprobar que es el token correcto** (sin pegarlo en ningún chat ni captura):

```bash
curl -s -G "https://graph.facebook.com/v26.0/debug_token" \
  --data-urlencode "input_token=$WHATSAPP_ACCESS_TOKEN" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
```

Debe decir `"application": "Saba-Chat"`, `"type": "SYSTEM_USER"`, `"expires_at": 0` y los dos permisos `whatsapp_business_*`.

---

## 5. Developers: clave secreta de la app

1. developers.facebook.com → **Saba-Chat** → **Configuración de la app → Básica**.
2. **Clave secreta de la app → Mostrar** (pide tu contraseña de Facebook) → copiar a `WHATSAPP_APP_SECRET`.
3. Con ella la API comprueba la firma `X-Hub-Signature-256` de cada webhook: si no coincide, responde **401** y no guarda nada.

En esa misma pantalla, **"Dominios de la app" se deja vacío**: es para el inicio de sesión con Facebook. Recién la coexistencia (Embedded Signup) va a necesitar el dominio real (`sabatransporte.com`), nunca uno de túnel.

---

## 6. Variables de entorno (`apps/api/.env`)

Solo en la **API**: el cliente nunca habla con Meta.

| Variable | De dónde sale | Secreto |
|---|---|---|
| `WHATSAPP_GRAPH_VERSION` | La versión que muestra Meta en los campos del webhook (hoy `v26.0`) | No |
| `WHATSAPP_ACCESS_TOKEN` | Paso 4 (usuario del sistema) | **Sí** |
| `WHATSAPP_APP_SECRET` | Paso 5 (Configuración de la app → Básica) | **Sí** |
| `WHATSAPP_VERIFY_TOKEN` | **Lo inventas tú**: `openssl rand -hex 32` en tu terminal. El mismo valor va en Meta (paso 7) | Sí |
| `WHATSAPP_PHONE_NUMBER_ID` | Paso 3 | No |
| `WHATSAPP_WABA_ID` | Paso 3 | No |

```bash
WHATSAPP_GRAPH_VERSION=v26.0
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_APP_SECRET=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=1014761568397246
WHATSAPP_WABA_ID=1293126782760816
```

Sin estas variables la API arranca igual; el webhook rechaza todo y responder desde el panel da "WhatsApp no está configurado en el servidor".

**Nunca** pegar tokens ni la clave secreta en chats, capturas o issues. Si se filtra uno: generar otro token en el paso 4 o restablecer la clave secreta en el paso 5, y actualizar el `.env`.

---

## 7. Developers: webhook (para recibir mensajes)

Meta necesita una **URL pública con HTTPS** que llegue a la API.

### 7.1 La URL

- **Desarrollo:** un túnel hacia la API local (puerto 8080).
  - Rápido, sin cuenta: `cloudflared tunnel --url http://localhost:8080` → da `https://algo.trycloudflare.com`. **Cambia en cada reinicio**: hay que volver a ponerla en Meta.
  - Fijo (pendiente): túnel con nombre `wa-dev.sabatransporte.com`. Requiere acceso a la cuenta de Cloudflare donde está el DNS de `sabatransporte.com` (la cuenta personal no muestra ese dominio). En *Public Hostname*: subdominio `wa-dev`, dominio `sabatransporte.com`, servicio **HTTP** (no HTTPS) `localhost:8080`.
- **Producción:** el dominio fijo de la API, por ejemplo `https://api.sabatransporte.com`.

La URL completa siempre termina en **`/api/v1/whatsapp/webhook`**. Antes de pegarla en Meta, abrir `…/api/v1/health/live` en el navegador: debe responder `success: true`.

Si Cloudflare tiene activada la protección anti-bots o un WAF, Meta no puede resolver desafíos: dejar pasar la ruta del webhook.

### 7.2 Registrar la URL

1. developers.facebook.com → **Saba-Chat** → **Casos de uso** → "Conectar en WhatsApp" → **Personalizar** → **Configuración** (en el menú clásico: **WhatsApp → Configuración**) → sección **Webhook → Editar**.
2. **URL de devolución de llamada:** `https://<dominio>/api/v1/whatsapp/webhook`
3. **Token de verificación:** el valor exacto de `WHATSAPP_VERIFY_TOKEN`.
4. **Verificar y guardar.** En ese momento Meta hace un `GET` a la API:
   - Se guarda → la API respondió el `challenge`.
   - "No se pudo validar" → en la terminal de la API: un **403** es token distinto (espacios, `.env` viejo sin reiniciar); ninguna petición es túnel o URL incorrectos.

### 7.3 Campos a suscribir

En **Campos del webhook** (más abajo, en la misma página). Meta activa algunos por su cuenta: dejar solo estos.

| Campo | Estado | Para qué |
|---|---|---|
| `messages` | ✅ Suscrito | Mensajes entrantes y estados de los enviados. **Indispensable.** |
| `message_template_status_update` | ✅ Suscrito | Aprobación/rechazo de plantillas |
| `template_category_update` | ✅ Suscrito | Meta reclasifica una plantilla UTILITY como MARKETING (más cara) |
| `account_update` | ✅ Suscrito | La cuenta se desconecta o restringe |
| `phone_number_quality_update` | ✅ Suscrito | Baja la calidad o el límite de envíos del número |
| `calls`, `security`, `account_alerts`, `account_review_update`, `message_template_quality_update`, `phone_number_name_update` | ❌ Desactivados | No se usan; solo llenarían `whatsapp_webhook_events` de ruido |
| `smb_message_echoes`, `history`, `smb_app_state_sync` | ⏸️ Después | Solo para coexistencia (fase 9) |
| `user_preferences` | ⏸️ Antes de marketing | Bajas de mensajes de marketing del cliente: suscribir y respetar antes de mandar plantillas MARKETING a clientes reales |

La versión de cada campo debe coincidir con `WHATSAPP_GRAPH_VERSION`.

### 7.4 Probar el webhook

1. En la fila de `messages` → **Probar** → dejar las opciones por defecto → **Enviar al servidor**.
2. En la terminal de la API: `POST /api/v1/whatsapp/webhook` con **200**. En Studio local (`http://localhost:54333`) → tabla `whatsapp_webhook_events`: una fila nueva.
   - **401** → `WHATSAPP_APP_SECRET` no es la clave de **Saba-Chat**.
3. Ese botón usa datos falsos (número `16315551181`, "test user name"): crean un contacto de prueba que se puede borrar desde Studio.

---

## 8. Conectar la app a la WABA (paso que se olvida)

El botón **Probar** llega aunque falte este paso, pero los **mensajes reales no**: Meta solo reparte los mensajes de una WABA a las apps **suscritas** a ella. Ya pasó: las pruebas llegaban y los mensajes del celular no.

```bash
# Conectar Saba-Chat a la WABA (una vez por WABA: la de prueba y, después, la real)
curl -X POST "https://graph.facebook.com/v26.0/$WHATSAPP_WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
# → {"success":true}

# Ver qué apps están conectadas
curl -s "https://graph.facebook.com/v26.0/$WHATSAPP_WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
```

En la lista debe aparecer **Saba-Chat (`2332812997518690`)**. "WA DevX Webhook Events 1P App" es de Meta y es normal. Cualquier otra app conectada **recibe una copia de los mensajes**: hay que saber de quién es (ver pendientes).

---

## 9. Prueba de punta a punta

Con la API, el túnel y las variables listas:

1. Desde un celular **autorizado** (paso 3.4), escribir al número de WhatsApp.
2. Studio → `whatsapp_webhook_events`: fila con el `phone_number_id` real (no `123456123`, que es el de las muestras de Meta). Luego aparecen el contacto, la conversación y el mensaje en `whatsapp_contacts`, `whatsapp_conversations` y `whatsapp_messages`.
3. En el panel, `/chats`: el chat aparece en unos segundos. Responder desde ahí: llega al celular y el mensaje pasa a entregado y leído.

### Errores frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| "No incluido en la lista de autorizados" (131030) | Número de prueba + destinatario fuera de la lista | Agregarlo en el paso 3.4 (o pasar al número real) |
| Webhook responde 401 | `WHATSAPP_APP_SECRET` incorrecto | Copiar la clave de Saba-Chat (paso 5) y reiniciar la API |
| Meta no valida la URL / 403 | `WHATSAPP_VERIFY_TOKEN` distinto | Mismo valor en `.env` y en Meta, reiniciar la API |
| "Probar" llega, los mensajes reales no | App no conectada a la WABA | Paso 8 |
| "El token de WhatsApp venció" (190) | Se usó el token temporal de 24 h | Token del usuario del sistema (paso 4) |
| El webhook dejó de llegar en desarrollo | Se reinició `cloudflared` y cambió la URL | Actualizar la URL en Meta (paso 7.2) |
| "Pasaron más de 24 h…" | Ventana de atención cerrada | Solo se puede escribir con plantilla (pendiente en el panel) |

---

## 10. Producción

Lo anterior deja todo funcionando con el **número de prueba**. Para atender clientes reales:

### 10.1 Decidir el número

- **(a) Número nuevo dedicado a la API** (recomendado para salir): funciona con el código actual cambiando solo las variables. El celular actual de Saba sigue como está.
- **(b) Número actual del celular con coexistencia** (app y API a la vez): requiere la fase 9 del plan (Embedded Signup, ecos, historial) y probablemente ser Tech Provider con App Review después de la verificación.

Un número registrado en la Cloud API **deja de funcionar en la app de WhatsApp del celular** (salvo coexistencia).

### 10.2 Pasos en Meta

1. **Verificación del negocio aprobada** (paso 1).
2. **Agregar el número real:** WhatsApp Manager (business.facebook.com → Cuentas de WhatsApp → la WABA → **Números de teléfono → Agregar número**), o *Paso 2: Configuración de producción* en el panel de la app.
   - El número no debe estar activo en la app de WhatsApp (o hay que borrar esa cuenta antes).
   - Se verifica con un código por SMS o llamada.
   - Se define un **PIN de verificación en dos pasos**: guardarlo en el gestor de contraseñas.
   - **Nombre visible** ("Saba…"): Meta lo revisa antes de que se vea.
3. **Método de pago:** business.facebook.com → **Facturación y pagos** → la cuenta de WhatsApp → agregar **tarjeta internacional** (idealmente de la LLC; las tarjetas en bolívares normalmente no funcionan). Sin método de pago Meta corta en ~1 000 respuestas al mes y no deja enviar plantillas.
4. **Asignar la WABA real** al usuario del sistema `saba-chat-api` con Control total (paso 4.3). Si el token se generó antes de asignar la WABA, generar uno nuevo.
5. **Conectar Saba-Chat a la WABA real** (paso 8, con el `WABA_ID` real).
6. **Webhook de producción** (paso 7) con la URL de la API en producción y un `WHATSAPP_VERIFY_TOKEN` **nuevo**. Para seguir probando en desarrollo con la WABA de prueba, Meta permite una URL de webhook distinta por WABA (*callback override*).
7. **Plantillas:** se crean en WhatsApp Manager → **Administrar plantillas**, idioma `es`, con ejemplo de cada variable. **Pertenecen a la WABA**: las de prueba no se trasladan, hay que recrearlas en la real. Categorías: UTILITY (relacionadas a una solicitud existente, ~$0.011) y MARKETING (leads, ~$0.074).

### 10.3 Variables de producción

Las mismas del paso 6, con el `WHATSAPP_PHONE_NUMBER_ID` y el `WHATSAPP_WABA_ID` del número real, el token del usuario del sistema y el `VERIFY_TOKEN` nuevo, en el entorno de despliegue de la API (no en el repo).

---

## 11. Estado actual (2026-10-08)

| Pieza | Estado |
|---|---|
| Portafolio | Saba Global Services LLC — verificación **en curso** |
| App | **Saba-Chat** `2332812997518690`, modo desarrollo |
| WABA de prueba | `1293126782760816` |
| Número de prueba | `+1 555 634 6598` · Phone Number ID `1014761568397246` |
| Usuario del sistema | `saba-chat-api`, token permanente generado |
| Webhook | Funciona de punta a punta por túnel rápido (`trycloudflare.com`), versión v26.0 |
| App conectada a la WABA | Sí (`subscribed_apps`) |

### Pendientes

- [ ] Verificación del negocio aprobada.
- [ ] Decidir número de producción: nuevo dedicado o coexistencia.
- [ ] Tarjeta internacional en Billing Hub (**por confirmar** si la LLC tiene).
- [ ] Hosting de la API con dominio HTTPS fijo para el webhook de producción.
- [ ] Acceso a la cuenta de Cloudflare de `sabatransporte.com` para el túnel fijo `wa-dev`.
- [ ] **Identificar la app "Saba" (`3027254144127246`)**, que también está conectada a la WABA de prueba y recibe sus mensajes. No es ninguna de las apps conocidas; desconectarla si nadie la reconoce, y que no se conecte a la WABA real.
- [ ] Crear las plantillas `seguimiento_solicitud` (UTILITY) y `contacto_lead` (MARKETING) en la WABA que corresponda.
