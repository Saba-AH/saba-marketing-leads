# Todo el código se escribe en inglés

Cualquier nombre que viva en el código va **en inglés**. Sin excepciones ni mezclas
(`ClienteCard`, `useSolicitudes`, `fechaCreacion` están prohibidos).

## Aplica a

- **Features y carpetas:** `features/chats/`, `shared/ui/components/form/`.
- **Componentes y sus archivos:** `ContactDetail.tsx`, `ImageViewer.tsx`, `Field` — no `Campo`, `VisorImagen`.
- **Props, estado, hooks y contexto:** `isLoading`, `onSelectContact`, `useLeadsQuery`, `ChatsContext`.
- **Capa `core/api` y servicios:** recursos, archivos y funciones (`core/api/leads/getPaginated.ts` → `getPaginatedLeads`).
- **Rutas de `src/app/`** (segmentos de URL): `/leads/[leadId]`, `/chats` — no `/solicitudes`.
- **Modelos de dominio, DTOs, transformadores, query keys, esquemas de formulario y sus campos.**
- **Variables, funciones, tipos, constantes, tests** (`describe`/`it` incluidos), handlers de MSW y **comentarios**.
- **Clases/tokens propios de CSS** y `data-testid`.

## No aplica a

- **Texto que ve el usuario:** etiquetas, botones, placeholders, toasts, mensajes de error y `aria-label` siguen en español — el panel es en español. El *nombre* de la constante va en inglés; el *contenido*, en español.
- **Datos de terceros:** si un DTO de integración trae campos en otro idioma, se traducen a nombres en inglés en `infrastructure/*.transform.ts`. La UI nunca ve el nombre externo.
- **Commits y docs** (`CLAUDE.md`, `.claude/rules/`, `agent_docs/`): siguen en español (ver `/.claude/rules/git-workflow.md`).

## Código existente en español

Código nuevo, siempre en inglés. Al tocar un archivo con nombres en español
(p. ej. `Campo` en `shared/ui/components/form/`), se renombran en el mismo cambio
si el alcance es acotado; si es un componente compartido muy usado, va en su propio PR.
