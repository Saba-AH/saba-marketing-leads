# CLAUDE.md — apps/client (panel interno)

## Qué estamos construyendo

El **panel interno de la app**: Next.js 15 (App Router) dentro de un monorepo Turborepo, con **SSR** (servidor Node, `output: 'standalone'`) empaquetado en un contenedor.

Optimizamos para UX rápida, fronteras claras (estructura por features) y seguridad de tipos (TS estricto + Zod).

---

## SSR

**`output: 'standalone'`.** El cliente corre como un servidor Node de Next, empaquetado en `.next/standalone` (ver `apps/client/Dockerfile`).

Están permitidos Server Components con fetch en servidor, route handlers y middleware. El servidor puede leer variables de entorno en runtime.

La frontera que **no** se cruza: el cliente **nunca** toca Postgres/Supabase directamente — todo dato de dominio pasa por la API de NestJS (`apps/api`). La lógica de negocio y el acceso a datos viven en `apps/api`, no en un route handler del cliente.

> En la práctica el estado de servidor lo sigue manejando **React Query desde el navegador** (ver `features/systemStatus/`): es el patrón por defecto del panel. SSR habilita render en servidor cuando aporte (primer pintado, SEO interno), pero no obliga a mover el fetch de datos al servidor.

---

## Stack

- **Next.js 15** (App Router, SSR `output: 'standalone'`)
- **React 19** · **TypeScript** estricto
- **Tailwind CSS 4** + **shadcn/ui** vía `@repo/ui`
- **@tanstack/react-query** — es la única capa de estado de servidor
- **react-hook-form + zod**
- **Auth:** Supabase Auth detrás de un BFF en Next. El navegador no ve tokens: viven en cookies `httpOnly` (`src/lib/session/`). `src/middleware.ts` exige sesión (y la renueva) en todo menos `/login`; `/api/session/{login,logout}` crean y cierran la sesión; `/api/backend/*` reenvía a `apps/api` con el `Authorization`. Ver `features/auth/`.
- Tests: **Jest** + Testing Library + **MSW**

Tooling del repo: Turborepo, npm workspaces, Biome.

---

## Base visual (prototipo)

Si el proyecto arranca desde un **prototipo** (p. ej. un export HTML con todas las vistas en `docs/prototypes/`), tratalo como la **base visual y de layout**, no como código para pegar:

- **Componentizá:** lo que se repite entre pantallas (tarjetas, campos, botones, encabezados) va a `@repo/ui` o `src/shared`; nada de markup duplicado.
- **Adaptá al stack:** implementá con **shadcn/ui + Tailwind** (vía `@repo/ui`); no copies el HTML/CSS crudo del export.
- El prototipo es el punto de partida y **puede evolucionar**: ante una mejora clara, aplicala y dejala anotada.

> Donde haya HTML puro reproduciendo algo que shadcn ya resuelve, se reemplaza por
> el componente de la librería — el aspecto sigue siendo el del prototipo, el
> markup no. Y **el color sale siempre de un token**, nunca de un hex literal.
> Detalle en `.claude/rules/shadcn-tokens.md`.

---

## Estructura por features

```
src/
├── app/                  # rutas: layouts y pages delgadas que solo montan una page de feature
├── features/<feature>/
│   ├── domain/           # modelo y reglas de la feature (sin React, sin fetch)
│   ├── application/      # queries y mutations de React Query, casos de uso
│   ├── infrastructure/   # servicios contra la API + transformadores DTO → dominio
│   └── ui/               # components · widgets · pages · layouts
├── core/                 # api/ (única salida HTTP a apps/api) + models/ (DTOs)
├── hooks/                # hooks de React Query transversales (varias features)
├── shared/               # lo que usan varias features
│   └── ui/components/    # componentes reutilizables (barrel: @/shared/ui/components) — ver .claude/rules/components.md
├── context/              # providers de navegador
└── lib/                  # cliente de API, query client, config
```

> Flujo de datos obligatorio: `core/api/<recurso>/<verbo>.ts` (llamada) →
> hook `useQuery`/`useMutation` (`src/hooks/` o `features/*/application/queries/`) →
> componente. Detalle en `.claude/rules/core-api.md` y `.claude/rules/react-query.md`.

`features/systemStatus/` es la referencia viva: recorre el camino completo desde el esquema compartido en `@repo/schemas` hasta la tarjeta en pantalla.

Reglas:

- Una feature **no importa** de otra. Lo común sube a `src/shared/`.
- Los DTOs de la API se transforman a modelo de dominio en `infrastructure/*.transform.ts`. La UI nunca ve el DTO crudo.
- El contrato de la API se define en `packages/schemas`, no aquí.

---

## No negociables

- `'use client'` solo donde haga falta (estado, efectos, APIs del navegador). Cualquier componente que consuma datos es cliente.
- **Un componente de React por archivo.**
- **camelCase** para carpetas y archivos que no sean componentes; los archivos de componente van en **PascalCase** (`SystemStatusCard.tsx`). Detalle en `agent_docs/codeStandard.md`.
- Imports absolutos con `@/` (que apunta a `src/`). Sin rutas relativas profundas.
- Sin `any` / `as any`.
- Nada de barrels como agregadores de export. Únicas excepciones: `features/*/infrastructure/index.ts` (cablea el cliente de API), `src/core/api/<recurso>/index.ts` (re-exporta las operaciones del recurso — ver `.claude/rules/core-api.md`) y **`src/shared/ui/components/`** (cada subcarpeta expone su `index.ts` y el `index.ts` raíz re-exporta todo — ver `.claude/rules/components.md`).
- Si la lógica crece dentro de un componente, se extrae a un helper o a un hook.
- **Todo formulario usa `react-hook-form` + `zod`.** Sin `useState` por campo ni `onChange` manual.
- **Todo componente reutilizable va en `src/shared/ui/components/`**, importado siempre desde `@/shared/ui/components`.

### Reglas detalladas (`.claude/rules/`)

Estándares específicos del cliente (se cargan por referencia):

@.claude/rules/react-rules.md
@.claude/rules/nextjs-routes.md
@.claude/rules/zod-schemas.md
@.claude/rules/core-api.md
@.claude/rules/react-query.md
@.claude/rules/shadcn-tokens.md
@.claude/rules/components.md


---

## Flujo de trabajo

**Research → Plan → Implement → Validate.**

1. Lee el código y los patrones existentes.
2. Escribe un plan corto (pasos, archivos, riesgos) y pide aprobación.
3. Implementa el cambio más pequeño que sea consistente.
4. Valida: `npm run typecheck`, `npm run lint`, `npm test`, y `npm run build`.

Nunca arranques un servidor de desarrollo ni hagas `curl` a endpoints locales por tu cuenta.

---

## Guías anidadas

Los documentos en `agent_docs/` describen los estándares del equipo para el cliente. Ahora que el cliente es SSR, sus secciones sobre RSC con fetch de datos, hidratación y route handlers **aplican** — con una salvedad: el acceso a datos de dominio pasa siempre por `apps/api`, nunca directo a Postgres/Supabase.

- Arquitectura y fronteras: `agent_docs/architecture.md`
- Data fetching (React Query, caché): `agent_docs/dataFetching.md`
- UI y estilos (shadcn, Tailwind, accesibilidad): `agent_docs/shadcn.md`
- Estándares de código: `agent_docs/codeStandard.md`
- Performance y Web Vitals: `agent_docs/performance.md`
- Testing: `agent_docs/testing.md`
