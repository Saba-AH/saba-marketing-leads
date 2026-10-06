# Data fetching

**Todo el consumo de datos ocurre en el navegador**, contra la API de NestJS, con React Query. No hay otra opción: el cliente es un export estático y no existe servidor en runtime.

> El patrón clásico de React Query en Next enseña acá el **prefetch en un Server Component + `dehydrate` + `HydrationBoundary`**. En este proyecto **no aplica**: los Server Components se ejecutan en *build time*, donde no hay sesión ni API a la que llamar. Un prefetch ahí hornea datos vacíos o desactualizados en el HTML. Se reemplazó por lo de abajo a propósito; no se reintroduzca.

## El patrón

Una capa por responsabilidad, dentro de la feature:

```
features/<feature>/
  infrastructure/<feature>.interfaces.ts   # el puerto: qué necesita de la API
  infrastructure/<feature>.service.ts      # llama a la API, lanza si falla
  infrastructure/<feature>.transform.ts    # DTO → modelo de dominio
  infrastructure/index.ts                  # cablea el cliente de API
  application/queries/useX.query.ts        # queryOptions + hook
  domain/<feature>.model.ts                # el modelo que consume la UI
```

`features/systemStatus/` lo recorre completo y es la referencia.

### 1. Servicio: traduce el `Safe<T>` a excepción

El cliente HTTP de `@repo/services` devuelve `Safe<T>` (`{ success, data } | { success, error }`), no lanza. React Query necesita una excepción para marcar el error, así que la traducción ocurre en el servicio:

```typescript
async getStatus(): Promise<SystemStatus> {
  const result = await this.healthApi.check();
  if (!result.success) {
    throw new Error(result.error);
  }
  return toSystemStatusDomain(result.data);
}
```

### 2. Query: `queryOptions` + hook

Siempre `queryOptions`, no el objeto inline: es lo que permite reutilizar la misma definición desde un `prefetchQuery`, un `invalidateQueries` o un `useSuspenseQuery` sin duplicar la clave.

```typescript
export const systemStatusQueryKeys = {
  all: () => ['systemStatus'] as const,
};

export function systemStatusQueryOptions() {
  return queryOptions({
    queryKey: systemStatusQueryKeys.all(),
    queryFn: () => SystemStatusService.getStatus(),
  });
}

export function useSystemStatus() {
  return useQuery(systemStatusQueryOptions());
}
```

### 3. Claves de query

Un objeto `<feature>QueryKeys` por feature, nunca un array literal suelto en el componente. Con `all()` como prefijo para poder invalidar la feature entera. Las claves que dependen de filtros los incluyen como último segmento, en orden estable.

## Reglas

- **Las mutaciones invalidan, no reescriben a mano.** `queryClient.invalidateQueries({ queryKey: xQueryKeys.all() })` en `onSuccess`. El update optimista es la excepción, no la norma, y siempre con rollback en `onError`.
- **El componente no conoce el DTO.** Recibe modelo de dominio; la transformación vive en `*.transform.ts`. Si la API cambia la forma de un campo, solo se toca ese archivo.
- **Fechas: el DTO trae ISO, el dominio trae `Date`.** La conversión es del transformador.
- **`staleTime` explícito cuando el dato lo amerita.** El default global está en `lib/get-query-client.ts` (60 s). Un catálogo de categorías tolera minutos; una cola de curaduría, no.
- **Nada de `useEffect` + `fetch`.** Si aparece, es que falta una query.
- **Validación con Zod en el borde**, con los esquemas de `@repo/schemas` — los mismos que valida la API. El cliente HTTP los aplica cuando se le pasan y desenvuelve el sobre `{ success, data }`.
- **El token va en el header, lo pone el cliente de API.** Ningún servicio de feature lo maneja a mano.
- **Un endpoint nuevo no se llama con `fetch` directo.** Se agrega al cliente de `@repo/services` y se consume desde el servicio de la feature.

## Estados de carga y error

Los tres estados se pintan siempre, y se distinguen dos fallos que no son lo mismo: **la API no responde** (error de la query) y **la API responde que algo está mal** (dato válido con estado de error). `SystemStatusCard.tsx` muestra la diferencia.

## Tests

MSW intercepta HTTP, así que el test recorre el mismo camino que producción —URL, sobre, parseo con el esquema compartido, transformación— sin doblar el cliente HTTP. Handlers en `src/__tests__/mocks/handlers/`, y `server.use(...)` para sobreescribir un caso puntual. Ver `src/__tests__/features/systemStatus.test.tsx`.
