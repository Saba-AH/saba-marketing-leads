# Capa `core/api` — el único lugar donde se llama a la API

Toda llamada HTTP a `apps/api` sale de `src/core/api/`. Ningún componente, hook de
feature ni route handler arma un `fetch` a la API por su cuenta. Patrón validado
en `jabian-frontend/core`.

## Estructura

```
src/core/
├── api/
│   ├── httpClient.ts            # cliente base: fetch + token + normalización de errores
│   └── <recurso>/
│       ├── get.ts               # una operación por archivo
│       ├── getPaginated.ts
│       ├── create.ts
│       ├── update.ts
│       ├── delete.ts
│       └── index.ts             # barrel: re-exporta las operaciones del recurso
└── models/
    └── <recurso>/               # DTOs + mappers del recurso (sin React)
```

- **Una operación por archivo.** El archivo se llama como el verbo (`getPaginated.ts`,
  `create.ts`) y exporta una función con el nombre completo (`getPaginatedClients`,
  `createClient`).
- `core/api/<recurso>/index.ts` **sí** puede ser barrel — es la excepción para esta
  capa, igual que `features/*/infrastructure/index.ts`. Nada más en `core/` usa barrels.
- `core/api` no importa React ni `@tanstack/react-query`. Es TS plano.

## `httpClient.ts`

Un único wrapper de `fetch`. Responsabilidades:

- Base `/api/backend`: el proxy del BFF (`src/app/api/backend/[...path]/route.ts`).
- El `Authorization` lo agrega el BFF desde la cookie `httpOnly`; el navegador nunca ve el token.
- `Content-Type: application/json`; serializa el body.
- Si `!response.ok`, lanza `Error` con el mensaje del backend ya normalizado
  (incluye el aplanado de errores Zod `{ formErrors, fieldErrors }`).
- `204` → devuelve `undefined`.
- Expone `get<T>`, `post<T>`, `patch<T>`, `delete<T>` tipados por genérico.

```ts
export const httpClient = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),
  post: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, headers }),
  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, headers }),
  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
};
```

## Cada operación

Función `async` que llama a `httpClient`, valida/parsea la respuesta contra el
esquema compartido de `@repo/schemas` y devuelve **modelo de dominio**, nunca el
DTO crudo. El mapeo DTO → dominio vive en `core/models/<recurso>/`.

```ts
// ❌ PROHIBIDO — fetch suelto en un componente o hook de feature
const res = await fetch(`${API}/clients?page=${page}`);
const json = await res.json();

// ✅ OBLIGATORIO — src/core/api/clients/getPaginated.ts
import type { GetPaginatedClientsParams, PaginatedClients } from '@/core/models/clients';
import { httpClient } from '../httpClient';
import { toClient } from './get';

export const getPaginatedClients = async (
  params: GetPaginatedClientsParams = {},
): Promise<PaginatedClients> => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  if (params.search?.trim()) query.set('search', params.search.trim());

  const res = await httpClient.get<GetPaginatedClientsApiResponse>(
    `/clients/paginated?${query.toString()}`,
  );

  return { data: (res.data ?? []).map(toClient), pageInfo: res.pageInfo };
};
```

```ts
// ✅ src/core/api/clients/create.ts
import type { Client, CreateClientInput } from '@/core/models/clients';
import { httpClient } from '../httpClient';

export const createClient = (data: CreateClientInput): Promise<Client> =>
  httpClient.post<Client>('/clients', data);
```

## Reglas

1. Ningún `fetch` a `apps/api` fuera de `src/core/api/`.
2. Una operación por archivo; nombre del archivo = verbo, export = nombre completo.
3. `core/api` es TS plano: sin React, sin React Query, sin estado.
4. La respuesta se parsea con Zod (`@repo/schemas`) y se devuelve modelo de dominio.
5. El único consumidor de `core/api` es un **hook de React Query** (ver
   `react-query.md`). Los componentes no importan de `core/api` directo.
