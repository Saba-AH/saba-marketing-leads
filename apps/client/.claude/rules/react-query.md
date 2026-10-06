# Estado de servidor con TanStack Query (`@tanstack/react-query`)

React Query es la **única** capa de estado de servidor del cliente. Todo dato que
viene de `apps/api` se consume a través de un hook que envuelve una operación de
`core/api` (ver `core-api.md`) en `useQuery` / `useMutation`. Patrón validado en
`jabian-frontend/hooks`.

## Prohibido para estado de servidor

```tsx
// ❌ fetch + useEffect + useState para datos de la API
const [data, setData] = React.useState<Client[]>([]);
React.useEffect(() => {
  fetch('/api/clients').then((r) => r.json()).then(setData);
}, []);

// ❌ llamar a core/api directo desde un componente
const clients = await getClients();
```

Cero `useEffect` para fetch, cero flags manuales de `loading` / `error`, cero
caché a mano. Eso lo da `useQuery`.

## Ubicación del hook

- Hook transversal (varias features lo usan): `src/hooks/use<Recurso>.ts`.
- Hook de una sola feature: `features/<feature>/application/queries/use<Cosa>.query.ts`.

Un archivo por hook. `'use client'` en la primera línea. Import named de
`useQuery` / `useMutation` (no viven en el namespace `React` — ver `react-rules.md`).

## Query (lectura)

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPaginatedClients } from '@/core/api/clients';

export const CLIENTS_QUERY_KEY = ['clients'] as const;

export function usePaginatedClients(page: number, search?: string, enabled = true) {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, 'paginated', page, search ?? ''],
    queryFn: () => getPaginatedClients({ page, search }),
    enabled,
    staleTime: 60_000,
  });
}
```

- **`queryKey` exportada como const** (`<RECURSO>_QUERY_KEY`) y reutilizada para
  invalidar. Todo parámetro que cambia el resultado va dentro de la key.
- **`queryFn` delega en `core/api`.** El hook no arma URLs ni parsea respuestas.
- `enabled` para posponer el fetch (modal cerrado, dato faltante).
- `staleTime` explícito cuando el dato no cambia seguido.

Para SSR / prefetch usar `queryOptions` compartido entre servidor y hook (ver
`features/systemStatus/application/queries/useSystemStatus.query.ts`).

## Mutation (escritura)

```ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient, updateClient, deleteClient } from '@/core/api/clients';
import { CLIENTS_QUERY_KEY } from './usePaginatedClients';

export function useClientsCrud() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });

  const create = useMutation({
    mutationFn: createClient,
    onSuccess: () => { toast.success('Cliente creado'); invalidate(); },
    onError: (error: Error) => toast.error(error.message || 'Error al crear'),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClientInput }) =>
      updateClient(id, payload),
    onSuccess: () => { toast.success('Cliente actualizado'); invalidate(); },
    onError: (error: Error) => toast.error(error.message || 'Error al actualizar'),
  });

  return {
    create: create.mutateAsync,
    isCreating: create.isPending,
    update: update.mutateAsync,
    isUpdating: update.isPending,
  };
}
```

- `onSuccess` → `invalidateQueries` con la `queryKey` afectada (o `onUpdated`
  callback del caller cuando el set de queries a refrescar depende de la pantalla).
- `onError` tipa el error como `Error` y muestra `error.message` (ya viene
  normalizado desde `httpClient`).
- El hook devuelve una forma aplanada (`create`, `isCreating`, …), no el objeto
  crudo de la mutation.

## Componentes

Solo consumen el hook. Nunca importan `core/api` ni `@tanstack/react-query`
directo para datos de dominio.

```tsx
'use client';

export function ClientsTable({ page }: { page: number }) {
  const { data, isPending, error } = usePaginatedClients(page);
  // ...
}
```

## Reglas

1. Todo dato de `apps/api` pasa por `useQuery` / `useMutation`. Sin `fetch` +
   `useEffect` para estado de servidor.
2. `queryFn` / `mutationFn` **siempre** delegan en una función de `core/api`.
3. `queryKey` exportada como const y usada para invalidar tras cada mutation.
4. Un hook por archivo, `'use client'`, en `src/hooks/` o
   `features/<feature>/application/queries/`.
5. El `QueryClient` y el provider ya están en `src/lib/get-query-client.ts` y
   `src/context/react-query.tsx`. No se crean clientes nuevos.
