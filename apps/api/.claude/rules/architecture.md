# Arquitectura y fronteras entre módulos

## Estructura de módulo

```
src/modules/<feature>/
  domain/                 # entidades, value objects, eventos, excepciones
  application/
    ports/in/             # interfaces de puertos de entrada
    ports/out/            # interfaces de puertos de salida
    use-cases/
  infrastructure/
    persistence/          # adaptadores de Drizzle
    web/                  # controllers y presenters de Nest
  module.ts               # cableado: puertos → adaptadores
  tokens.ts               # símbolos de inyección
```

`src/modules/health/` es la referencia completa y mínima. **El dominio no importa Nest, ni HTTP, ni Drizzle**; el caso de uso solo conoce interfaces.

Infraestructura compartida: `src/infrastructure/database/` (pool y agregador de esquema), `src/infrastructure/logging/` (`StructuredLogger`, id de correlación por `AsyncLocalStorage`, redacción de secretos), `src/infrastructure/errors/` (`DomainException`, `DomainToHttpMapper`, filtros globales), `src/infrastructure/i18n/domainMessages.ts` (catálogo agregado de mensajes de dominio), `src/infrastructure/saba/sabaApi.ts` (config, URLs y headers del servidor de Saba: service key, token del agente, IP y user agent reenviados), `src/shared/` (pipe de Zod, decoradores de Swagger, `@Public()`, `@RequirePermissions()`), `src/security.module.ts` (throttling), `src/bus.module.ts` (CQRS).

## Fronteras entre módulos

`docs/api_modules.md` es el mapa canónico. **Todo módulo nuevo se registra ahí —dueño de tablas y puertos entre módulos— antes o en el mismo PR que su implementación.**

1. **La propiedad de tablas es exclusiva.** Cada tabla pertenece a exactamente un módulo. Ningún otro la consulta con Drizzle directamente.
2. **Las lecturas entre módulos van por puertos in-process.** El consumidor declara la interfaz en **su propio** `application/ports/out/` (p. ej. `IAssetReader`); el dueño provee el adaptador en su `infrastructure/` y lo exporta desde su módulo de Nest.
3. **Los módulos de dominio exportan puertos de fachada, nunca de repositorio.** Una fachada expone solo lo que otros necesitan de verdad. Exportar un `RepositoryPort` filtra la persistencia a todo el que lo consuma. Un módulo de puro catálogo (sin comportamiento que encapsular) puede exportar repositorios directamente.
4. **Los efectos secundarios van por eventos.** Correo, notificaciones o reprocesamiento se disparan con un evento tipado (`@nestjs/event-emitter`) o un comando por el bus. Un caso de uso de negocio no importa `EmailModule` ni otro módulo de negocio hermano.
