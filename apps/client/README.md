# @repo/client — panel interno

Next.js 15 (App Router) con **SSR** (`output: 'standalone'`), empaquetado como servidor Node en un contenedor (`Dockerfile`).

## Correr

Desde la raíz del monorepo (levanta también Postgres y la API):

```bash
npm run dev
```

Solo el cliente:

```bash
npm run dev -w @repo/client     # http://localhost:3002
```

Requiere `apps/client/.env.local` (copiar de `.env.example`). `NEXT_PUBLIC_API_URL`, al ser `NEXT_PUBLIC_`, se embebe en el bundle en build time: cambiar de ambiente exige reconstruir.

## Comandos

| Comando | |
|---------|--|
| `npm run build -w @repo/client` | `next build` → servidor SSR en `.next/` |
| `npm run start -w @repo/client` | `next start` — sirve el build SSR en :3002 |
| `npm test -w @repo/client` | Jest + Testing Library + MSW |
| `npm run typecheck -w @repo/client` | `tsc --noEmit` |

## La frontera de datos

El cliente **nunca** toca Postgres/Supabase directamente: todo dato de dominio pasa por la API de NestJS (`apps/api`). La lógica de negocio y el acceso a datos viven ahí, no en un route handler del cliente. El estado de servidor lo maneja React Query desde el navegador (patrón por defecto); SSR se usa donde aporte.

## Estructura por features

```
src/
├── app/                  # rutas delgadas que solo montan una page de feature
├── features/<feature>/{domain,application,infrastructure,ui}
├── shared/               # lo que usan varias features
├── context/              # providers de navegador
└── lib/                  # cliente de API, query client
```

`features/systemStatus/` recorre el camino completo: esquema compartido en `@repo/schemas` → servicio → transformador → query de React Query → tarjeta en pantalla. Ver `CLAUDE.md` para las convenciones.
