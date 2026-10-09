# Todo el código se escribe en inglés

Cualquier nombre que viva en el código va **en inglés**. Sin excepciones ni mezclas
(`getClientes`, `LeadEstado`, `fechaCreacion` están prohibidos).

## Aplica a

- **Módulos y carpetas:** `modules/sabaClients/`, no `modules/sabaClientes/`.
- **Archivos y clases:** `CreateLeadUseCase.ts`, `LeadsController.ts`, `ContactRepository.ts`.
- **Rutas HTTP y parámetros:** `GET /leads/:leadId/messages`, `?status=pending` — nunca `/solicitudes`, `?estado=`.
- **Contrato (`packages/schemas`):** nombres de esquemas Zod y de sus campos (`createdAt`, `phoneNumber`, `documentId`).
- **Persistencia:** tablas, columnas, enums, índices y nombres de migración de Drizzle (`leads.created_at`, `lead_status`).
- **Dominio:** entidades, value objects, puertos, casos de uso, eventos y códigos de error (`LEAD_NOT_FOUND`, no `SOLICITUD_NO_ENCONTRADA`).
- **Variables, funciones, tipos, constantes, DTOs, tests** (`describe`/`it` incluidos) y **comentarios**.
- **Variables de entorno y claves de config:** `WHATSAPP_ACCESS_TOKEN`.

## No aplica a

- **Texto que ve el usuario final:** los mensajes de `infrastructure/i18n/messages.ts` siguen en español (ver `errors.md`). La *clave* va en inglés; el *valor*, en español.
- **Datos o contratos de terceros:** si un sistema externo (p. ej. un endpoint de Saba o la API de Meta) devuelve campos en otro idioma, se respetan en el DTO de integración y se traducen a nombres en inglés en el mapper de `infrastructure/`. El dominio nunca ve el nombre externo.
- **Commits y docs** (`CLAUDE.md`, `.claude/rules/`, `docs/`): siguen en español (ver `/.claude/rules/git-workflow.md`).

## Código existente en español

Código nuevo, siempre en inglés. Al tocar un archivo con nombres en español, se
renombran en el mismo cambio si el alcance es acotado; si el renombre cruza el
contrato o la base (columnas, rutas), va en su propio PR con migración.
