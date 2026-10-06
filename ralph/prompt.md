# ISSUES

Open GitHub issues labeled `ready-for-agent`, fetched via `gh issue list`, are inlined at the start of your context as JSON (`number`, `title`, `body`, `labels`, `comments`). These are the only issues you're allowed to work on — the label means they're fully specified and AFK-ready. Read each issue's `comments` too: a previous iteration may have left a progress note there.

The last few commits are also inlined. Review them to understand what work has been done.

Los títulos usan la notación `[ENN·MM]` (épica·ticket): `ENN` es el número de épica y `MM` el del ticket dentro de ella. Cada issue tiene además su label de épica (`ENN`) y un milestone.

If all AFK tasks are complete, output <promise>NO MORE TASKS</promise>.

# RESUME BEFORE YOU START

Each iteration starts with a fresh context, so **first check whether a previous iteration left work in flight** — before picking anything new:

- `gh pr list --state open` — un PR abierto **de un issue que TODAVÍA tiene `ready-for-agent`** es trabajo **en vuelo** → retomalo (`gh pr view <n>`, `gh pr diff <n>`) y seguí en su rama. Un PR de un issue **sin** `ready-for-agent` ya está **listo esperando merge humano** → **no lo toques**.
- `git worktree list` y `git branch -a` — un worktree/rama que quedó te dice dónde vive ese trabajo.

Retomá el issue en vuelo antes de empezar otro, y nunca abras un segundo PR para un issue que ya tiene uno. Solo si no hay nada en vuelo pasás a TASK SELECTION.

# TASK SELECTION

Pick one task. Prioritize in this order:

1. Critical bugfixes
2. Development infrastructure (test harness, build, tooling) — abarata cada iteración futura.
3. Tracer bullets: una rebanada fina end-to-end de una feature nueva (schema → API → UI → tests), y después se expande.
4. Polish y quick wins
5. Refactors

Dentro de un tier, preferí un issue que se apoye en trabajo ya mergeado sobre uno que necesite una base que todavía no existe.

**Sobre `Blocked by:`** — mirá QUÉ tipo de bloqueante es:
- Si el bloqueante es **otro ticket de CÓDIGO** de este repo cuyo código todavía **no está mergeado**, saltá el issue (no podés apoyarte en algo que no existe).
- Si el bloqueante es **infra / habilitación / provisión** (GCP, Firebase, Cloud SQL, accesos, cuotas — típicamente tickets de consola), **no te frena**: scaffoldeá igual, env-abstraído (ver «Scaffolding cuando falta el entorno»). Ese acceso lo enchufa un humano después.

**Si el proyecto tiene tareas de infraestructura cloud** (Cloud SQL, Cloud Run, Firebase, Vertex, buckets, OAuth…), no las saltes en bloque: casi todas tienen una **parte de código/config que vive en el repo** y SÍ es scaffoldeable ahora — `cloudbuild.yaml`, `Dockerfile`, `env.yaml`, el módulo de config que lee `process.env` (validado con Zod), puertos/adaptadores por cada servicio externo, health checks, logs estructurados. **Escribí esa parte, env-abstraída** (ver «Scaffolding cuando falta el entorno»). Lo único que NO hacés es **provisionar GCP/consola**: no corras `gcloud … create`, no crees proyectos/buckets/service-accounts/secretos — esa mitad la hace un humano. Dejala marcada con `// TODO(env):` y una nota clara en el PR. Ralph produce **código y archivos de config del repo** (`apps/api`, `apps/client`, `packages/*`), no recursos en la nube (el IaC vive en un repo Pulumi aparte).

# EXPLORATION

Este repo documenta su propia arquitectura — leela antes de buscar a ciegas:

1. **`CLAUDE.md`** (raíz) manda en todo el monorepo. Cada subcarpeta con su propio `CLAUDE.md` gana en su ámbito (`apps/api/CLAUDE.md`, `apps/client/CLAUDE.md`). Cada uno referencia reglas detalladas en `.claude/rules/` (raíz: `git-workflow`, `typescript`; `apps/api`: `architecture`, `persistence`, `web-layer`, `permissions`, `errors`, `nestjs-and-tests`; `apps/client`: `react-rules`, `nextjs-routes`, `zod-schemas`). **Leé las reglas del área que vas a tocar antes de escribir código.**
2. **`docs/agents/`** — `issue-tracker.md`, `triage-labels.md`, `domain.md`. **`CONTEXT.md`** (glosario de dominio) está en la raíz; `docs/adr/` se crea cuando una decisión lo amerite (ver `docs/agents/domain.md`).
3. **`apps/api/docs/api_modules.md`** es el mapa canónico de fronteras entre módulos. Todo módulo nuevo se registra ahí (dueño de tablas + puertos) en el mismo PR.
4. **Solo entonces** buscá en el código el análogo existente más cercano. Estructura:
   - `apps/api/` — NestJS, hexagonal por módulo (`domain/` · `application/{ports,use-cases}` · `infrastructure/{web,persistence}`). Drizzle sobre Postgres + pgvector. Referencia: `src/modules/health/`.
   - `apps/client/` — Next.js 15 App Router, **SSR (`output: 'standalone'`), desplegado en Cloud Run**. Organizado por features: `features/<f>/{domain,application,infrastructure,ui}`. Referencia: `features/systemStatus/`.
   - `packages/schemas/` — el contrato de la API en Zod, **compartido** por ambas apps. Un endpoint nuevo define su esquema ahí.

**La frontera que no se cruza:** `apps/client` es SSR (`output: 'standalone'`, Cloud Run), así que route handlers, middleware y RSC con fetch están permitidos — pero el cliente **nunca** toca Postgres ni Cloud Storage directo: todo dato de dominio pasa por `apps/api`. La lógica de negocio y el acceso a datos van en `apps/api`, no en el cliente.

# IMPLEMENTATION

Usá `/implement` para completar la tarea. Corre `/tdd` en los seams acordados y `/code-review` antes de commitear — dejalo, no saltes directo al commit.

Igualá las convenciones encontradas en EXPLORATION exactamente. Un módulo de Nest, una feature del cliente, un esquema en `packages/schemas` siguen la forma de su análogo más cercano — no inventes un patrón que el repo ya resolvió. Donde no haya análogo, seguí las reglas de `.claude/rules/` del área.

## Scaffolding cuando falta el entorno
Muchos flujos dependen de accesos/credenciales que **todavía no están** (Firebase/Entra ID, Vertex y Storage de prod, Eventarc). No esperes por ellos: **dejá la estructura y la lógica completas, env-abstraídas**, para que después solo se enchufen los env.

- Leé toda la config del **entorno** (`process.env.*`) — nunca hardcodees proyectos, buckets, credenciales ni endpoints.
- Poné las llamadas externas (Vertex, Storage, correo) **detrás de un puerto** en `application/ports/out/`, con el adaptador en `infrastructure/`. El caso de uso queda testeable con un doble; el adaptador real se completa cuando lleguen los env.
- Usá lo que **sí** hay ahora: **auth por correo/contraseña** (Entra ID llega después), Postgres local.
- Donde falte un env/credencial real, dejá un `// TODO(env): ...` claro y agregalo a `apps/api/.env.example`.
- Codeá hacia la **forma de prod** de las env: en Cloud Run la auth a GCP es por **ADC** (SA de runtime, sin archivos de key), y asumí **un solo proyecto GCP** para todo (Vertex + Storage). Los proyectos separados / key files del `.env` de prueba son provisionales — leé project/bucket/location de `process.env`, no los hornees.
- Meta: que un humano solo tenga que **poner los env y probar**, sin reescribir lógica.

## Definition of done

Antes de abrir el PR:

- **`CLAUDE.md` / `.claude/rules/`**: si estableciste un patrón nuevo en un área, dejalo documentado para la próxima iteración.
- **`apps/api/docs/api_modules.md`**: si agregaste un módulo o un puerto entre módulos, registralo.
- **Agregador de esquema (`apps/api`)**: todo `*.schema.ts`, `relations()` y `pgEnum` nuevo se reexporta desde `src/infrastructure/database/db-schema.ts` en el mismo PR (si no, explota en runtime).
- **Migraciones (`apps/api`)**: si tocaste el esquema, generá la migración (`npm -C apps/api run db:generate`) y escribí su reversa en `drizzle/down/`.
- **`CONTEXT.md`**: creá o afiná la entrada del glosario cuando el trabajo introduce o precisa un término de dominio.
- **ADR** (`docs/adr/NNNN-<titulo>.md`): solo cuando la decisión condiciona cómo se implementan tickets posteriores (una convención transversal, una regla de acceso, la elección de un proveedor) — no para feature routine.

# FEEDBACK LOOPS

**Usá `npm`, no `pnpm`.** Todos los comandos desde la raíz del repo salvo que se indique.

Mientras desarrollás, corré los checks rápidos y dirigidos:

- `npx turbo typecheck --filter @repo/api` (o `--filter @repo/client`) — type-check del workspace que tocás.
- `npx biome check <ruta>` — lint/format sobre lo que cambiaste. Arreglar: `npx biome check --write <ruta>`.

Antes de dar el PR por listo, corré los loops completos una vez, en este orden (lo mismo que el CI):

- `npm run format-and-lint` — Biome sobre todo el repo (lo mismo que corre el CI).
- `npm run typecheck` — `tsc --noEmit` en cada workspace.
- `npm test` — Vitest (api) + Jest (cliente). **Los tests de `apps/api` corren contra Postgres real**; necesitan `npm run db:up` (docker) levantado. Si el sandbox no puede correr ese Postgres, corré lo que puedas y **apoyate en el CI** como gate real (el workflow ya levanta un servicio Postgres).
- `npm run build` — compila todo; el cliente compila su servidor SSR en `apps/client/.next/` (standalone).

**Este repo SÍ tiene CI** (`.github/workflows/ci.yml`): corre esos mismos pasos con un servicio Postgres. **El CI verde es el gate**; el humano mergea sobre CI verde. Nunca des un PR por listo sobre un run que saltaste o interrumpiste.

Nunca arranques un server de desarrollo ni hagas `curl` a endpoints locales por tu cuenta.

# GIT WORKFLOW

Nunca commitees directo a `main` ni a `development`. Para cada tarea:

1. Worktree en una rama nueva nombrada por el issue: `git worktree add ../issue-<n>-<slug> -b issue-<n>-<slug>`. Trabajá ahí, no en el checkout principal.
2. Commiteá con la convención de commits del repo (Conventional Commits en español; ver `.claude/rules/git-workflow.md`). El mensaje incluye: decisiones clave, archivos cambiados, y notas/bloqueantes para la próxima iteración.
3. Push: `git push -u origin issue-<n>-<slug>`.
4. Abrí PR **contra `development`** (la rama de integración, no `main`): `gh pr create --base development`, referenciando el issue con `Closes #<n>` para que el merge lo cierre.
5. Un solo PR por issue. Si una iteración posterior continúa el mismo issue, empujá más commits a la rama/PR existente — nunca abras un segundo PR.
6. **NO mergees.** Este loop **no** auto-mergea: un humano revisa y mergea. Dejá el PR **abierto**, con los loops verdes y una descripción clara (decisiones tomadas + qué falta si algo quedó pendiente).
7. **Al terminar el issue** (completo, loops verdes): quitale el label con `gh issue edit <n> --remove-label ready-for-agent` y dejá un comentario `✅ Listo para revisión humana — no auto-mergeado`. Eso lo saca del pool AFK y evita que la próxima iteración lo retome. **Dejá el PR abierto y la rama/worktree en pie**; el humano mergea (el `Closes #<n>` cierra el issue).

# THE ISSUE

Si la tarea está **completa**: seguí el paso 7 de GIT WORKFLOW — PR abierto, quitá `ready-for-agent`, comentá "listo para revisión". **No mergees** ni corras `gh issue close`: el humano mergea y el `Closes #<n>` cierra el issue.

Si NO está completa: **dejá el `ready-for-agent` puesto**, dejá una nota de progreso en el issue (`gh issue comment <number> --body "..."`) con qué se hizo, qué falta y lo que la próxima iteración redescubriría a lo difícil, y dejá el PR abierto en su rama. Así el RESUME de la próxima iteración lo retoma.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
