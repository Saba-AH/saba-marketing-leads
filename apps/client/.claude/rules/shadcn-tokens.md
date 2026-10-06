# Componentización con shadcn/ui y tokens de color

El panel se construye con **componentes de `@repo/ui` (shadcn/ui)**, no con HTML
suelto estilado a mano. El prototipo (si existe, en `docs/prototypes/`) es la
base visual — el aspecto final debe seguir pareciéndose a él — pero el markup se
implementa con la librería.

## 1. Antes de escribir markup, buscá el componente

Si estás por escribir un `<div>` con clases que reproducen algo que la librería ya
resuelve (una tabla, un desplegable, un aviso, un diálogo), **instalá el componente
en vez de reescribirlo**:

```bash
npx shadcn@canary add <component-id> --cwd packages/ui
```

El catálogo completo está en `agent_docs/shadcn.md`. Lo que ya está instalado se
mira en `packages/ui/src/components/`.

El CLI deja un archivo plano (`table.tsx`); el repo usa **una carpeta por
componente** con el archivo en PascalCase y un `index.ts` que reexporta, como
`components/button/Button.tsx`. Acomodalo después de instalar.

Reemplazar HTML puro por el componente equivalente es un cambio bienvenido, no
scope creep — siempre que el resultado se siga viendo como el prototipo.

## 2. El color sale de la capa semántica, nunca de un literal

Hay tres capas y solo una se toca desde una vista:

| Capa | Dónde | Ejemplo | ¿Se usa en una vista? |
|---|---|---|---|
| Primitivos | `packages/ui/src/styles/color-variables.css` | `brand-600`, `gray-200`, `error-100` | **No** |
| Semántica (shadcn) | `packages/ui/src/styles/globals.css` | `bg-primary`, `border-border`, `bg-muted` | **Sí** |
| Utilidades propias | `apps/client/src/css/{bg,fg,text,border}-variables.css` | `bg-surface`, `txt-primary` | Sí, donde ya se usan |

```tsx
// ❌ PROHIBIDO — un color literal en una vista
<div className="border-[#e4e4e7] bg-[#fafafa]" />

// ❌ EVITAR — un primitivo suelto donde existe un token semántico
<div className="border-gray-200 bg-gray-50" />

// ✅ OBLIGATORIO
<div className="border-border bg-muted" />
```

**Por qué**: cada componente de shadcn lee `--primary`, `--border`, `--muted`. Están
mapeados a la paleta de la marca en `packages/ui/src/styles/globals.css`, así que un
componente nuevo sale en marca sin que nadie le pase `className`. Un literal o un
primitivo suelto rompe esa cadena y obliga a repetir el color en cada archivo.

Si el color que necesitás no tiene token semántico, **el arreglo es agregar el
token**, no escribir el hex. Un grupo nuevo va en `color-variables.css` con un
comentario que diga de dónde sale.

Excepción: la pantalla de acceso es una superficie oscura fuera del tema del panel
y tiene su propio grupo (`auth-bg`, `auth-surface`, `auth-border`, `auth-online`).
Siguen siendo tokens: tampoco ahí se escribe un hex.

## 3. Lo que se repite, se comparte

Un componente usado por más de una feature vive en `src/shared/ui/components/`.
Uno genérico, sin nada del dominio de la app, vive en `@repo/ui`. Una feature nunca
importa un componente de otra.

Antes de crear un componente, mirá si ya existe: `src/shared/ui/components/` tiene
tabla, buscador, filtros, estados vacíos y de error, píldoras y primitivos de
formulario.
