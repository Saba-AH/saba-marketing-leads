# Errores

- Las excepciones de dominio llevan **solo un código**, nunca un mensaje para humanos: extienden `DomainException` (`src/infrastructure/errors/DomainException.ts`) con `super('<MODULO>_<CODIGO>')`.
- Convención: `<MODULO>_<SCREAMING_SNAKE>` — `USER_NOT_FOUND`, `SESSION_PERMISSION_DENIED`, `RESOURCE_ALREADY_EXISTS`.
- Los mensajes viven en `modules/<feature>/infrastructure/i18n/messages.ts` y se agregan en `src/infrastructure/i18n/domainMessages.ts`. **Un solo catálogo, en español**: el panel es interno y no hay segundo idioma en alcance.
- La resolución del mensaje ocurre **solo en la capa de filtros**: `DomainExceptionFilter` (`@Catch(DomainException)`) y `HttpExceptionFilter` (`@Catch()`, red de seguridad para todo lo demás — `HttpException` de Nest y cualquier error sin capturar), ambos registrados como `APP_FILTER` globales en `src/infrastructure/errors/ErrorsModule.ts`, en ese orden (el específico antes del catch-all).
- Estado ≥ 500 siempre resuelve a `INTERNAL_ERROR`. Nunca se filtra el detalle crudo.
- Las respuestas de error llevan `correlationId`, `timestamp` y `path` (`src/infrastructure/errors/ErrorResponseBody.ts`).
- El rechazo por permisos es **explicable** —"no tienes acceso a esto"—, no un error genérico.
- **Ningún log ni mensaje de error imprime tokens, contraseñas ni URLs firmadas completas** — `StructuredLogger`/`redact()` (`src/infrastructure/logging/`) tapan claves sensibles automáticamente, pero un `context`/campo libre puede igual filtrar algo si no pasa por ahí.

`src/infrastructure/errors/DomainToHttpMapper.ts` tipa el mapeo como `Record<DomainErrorCode, HttpStatus>`: un código nuevo en `domainMessages` sin su entrada ahí es un error de `tsc`, no un 500 enmascarado descubierto en producción.

## Agregar un error de dominio

1. Subclase de `DomainException` en `modules/<feature>/domain/exceptions/` — `super('<MODULO>_<CODIGO>')`.
2. Código en la unión de tipos + traducción en `modules/<feature>/infrastructure/i18n/messages.ts`.
3. Agregar el catálogo del módulo a `src/infrastructure/i18n/domainMessages.ts` (solo si el módulo es nuevo).
4. Mapear a estado HTTP en `src/infrastructure/errors/DomainToHttpMapper.ts`.
5. `npx turbo typecheck --filter @repo/api` — las traducciones faltantes son errores de tipo.
