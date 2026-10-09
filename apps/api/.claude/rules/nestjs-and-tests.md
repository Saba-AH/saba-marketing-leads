# NestJS y tests

## Aprovechar NestJS

- **Inyección por token** (`tokens.ts` + `useExisting`), no `new` dentro de un caso de uso.
- **Guards, interceptores, pipes y filtros** antes que código repetido en cada controller. Lo transversal es transversal.
- **`@nestjs/cqrs`** (`BusModule`, ya global) para comandos y queries cuando el flujo lo pida; eventos para desacoplar efectos.
- **Hooks de ciclo de vida** (`OnModuleDestroy`) para cerrar pools y conexiones.
- **Swagger desde los esquemas**: `ZodApiBody` / `ZodApiResponse` (`shared/decorators/zodSwagger.ts`). La documentación sale del contrato, no de un JSDoc que se desactualiza.
- **Las variables de entorno se leen en infraestructura**, nunca en dominio ni en aplicación.

## Tests

Los casos de uso se instancian directo, sin TestBed. Los puertos se doblan con objetos planos o `vi.fn()`. Se afirma sobre el valor devuelto o la excepción lanzada. Ver `src/test/health/health.test.ts`.

Lo que sí necesita base de datos —SQL cruda, migraciones, transacciones— se prueba contra el **Postgres local** de `docker-compose.yml` (`npm run db:up`), no contra un doble. Saba nunca se llama de verdad en los tests: se doblan sus adaptadores (`HttpSabaAuthGateway`, `HttpSabaCustomersReader`) o se stubbea `fetch`.
