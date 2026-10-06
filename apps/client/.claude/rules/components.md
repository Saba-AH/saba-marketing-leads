# Componentización y `src/shared/ui/components/`

## Principio

Todo elemento visual reutilizable entre features **es un componente compartido**.
Vive en `src/shared/ui/components/`. Una feature solo crea su propio componente si
es **exclusivo de esa feature y no se comparte**. En cuanto otro lugar lo necesite,
sube a `src/shared/ui/components/`.

Componentes genéricos sin nada del dominio de la app (primitivos: botón, input, tabla
base) viven en `@repo/ui`. `src/shared/ui/components/` construye encima de esos
primitivos con lógica y estilo de la app.

---

## Estructura de `src/shared/ui/components/`

```
src/shared/ui/components/
├── dataTable/              # DataTable y sus sub-componentes
│   ├── DataTable.tsx
│   ├── DataTableHead.tsx
│   ├── DataTableBody.tsx
│   ├── DataTableRow.tsx
│   ├── DataTableMessage.tsx
│   ├── DataTableName.tsx
│   ├── DataTableSub.tsx
│   ├── dataTableContext.ts
│   └── index.ts            # exporta todos los sub-componentes del grupo
├── form/                   # primitivos de formulario (Campo, RadioRow, etc.)
│   ├── Campo.tsx
│   ├── RadioRow.tsx
│   ├── RadioOpt.tsx
│   ├── BrandChip.tsx
│   ├── AlertBanner.tsx
│   ├── BotonAgregarBloque.tsx
│   ├── campoClases.ts
│   └── index.ts
├── EstadoPill.tsx          # componentes sin sub-estructura propia
├── Pill.tsx
├── SearchBox.tsx
├── Paginacion.tsx
├── FiltersRow.tsx
├── FiltroSelect.tsx
├── FiltroChips.tsx
├── FilterChip.tsx
├── LimpiarFiltros.tsx
├── CampoDeChips.tsx
├── CampoHint.tsx
├── EmptyState.tsx
├── ErrorState.tsx
├── PageHeader.tsx
├── PageShell.tsx
├── ModalFooter.tsx
├── Proximamente.tsx
└── index.ts                # barrel raíz: re-exporta todo
```

### Regla de subcarpeta

Un grupo de componentes cohesivos (varios archivos que trabajan juntos) va en su
propia subcarpeta con un `index.ts` interno. Un componente standalone va directo en
la raíz. **No crear subcarpetas de un solo archivo.**

---

## Barrels

Cada subcarpeta expone un `index.ts` que exporta sus componentes públicos.
El `index.ts` raíz re-exporta todo:

```ts
// src/shared/ui/components/dataTable/index.ts
export { DataTable } from './DataTable';
export { DataTableHead } from './DataTableHead';
export { DataTableBody } from './DataTableBody';
export { DataTableRow } from './DataTableRow';
export { DataTableMessage } from './DataTableMessage';
export { DataTableName } from './DataTableName';
export { DataTableSub } from './DataTableSub';
export { DataTableContext } from './dataTableContext';

// src/shared/ui/components/index.ts
export * from './dataTable';
export * from './form';
export { EstadoPill } from './EstadoPill';
export { Pill } from './Pill';
export { SearchBox } from './SearchBox';
// ... una línea por componente raíz
```

Los imports en features y pages siempre vienen del barrel raíz:

```tsx
// ✅ OBLIGATORIO
import { DataTable, DataTableHead, Campo } from '@/shared/ui/components';

// ❌ PROHIBIDO — import profundo saltándose el barrel
import { DataTable } from '@/shared/ui/components/dataTable/DataTable';
```

Actualizar el `index.ts` raíz es **parte de la tarea** cuando se agrega un
componente nuevo. No es opcional.

---

## Qué va en `src/shared/ui/components/`

| Categoría | Ejemplos existentes | Qué más puede ir |
|-----------|---------------------|-----------------|
| **Tablas** | `DataTable` y sub-componentes | columnas genéricas |
| **Formularios** | `Campo`, `RadioRow`, `BrandChip` | formularios con RHF (ver abajo) |
| **Filtros** | `SearchBox`, `FiltroSelect`, `FiltersRow`, `FilterChip` | cualquier filtro nuevo |
| **Estado / feedback** | `EmptyState`, `ErrorState`, `EstadoPill`, `Pill` | loaders, toasts |
| **Layout** | `PageHeader`, `PageShell`, `ModalFooter` | secciones, sidebars |
| **Utilidades** | `Paginacion`, `Proximamente`, `LimpiarFiltros` | — |

---

## Formularios — obligatorio usar `react-hook-form`

**Todo formulario de dominio (crear, editar, filtrar) usa `react-hook-form` +
`zod` via `@hookform/resolvers/zod`.** No hay formularios con `useState` por campo
ni con `onChange` manual.

Formularios de dominio van en `src/shared/ui/components/form/` si son reutilizables,
o en `features/<feature>/ui/` si son exclusivos de una feature.

```tsx
// ❌ PROHIBIDO — estado manual por campo
const [nombre, setNombre] = React.useState('');
<input value={nombre} onChange={(e) => setNombre(e.target.value)} />

// ✅ OBLIGATORIO
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Correo inválido'),
});

type FormValues = z.infer<typeof schema>;

export function ClienteForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
}): React.JSX.Element {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', email: '', ...defaultValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Guardar
        </Button>
      </form>
    </Form>
  );
}
```

### Reglas de formularios

1. **Esquema Zod primero.** Define el esquema antes del JSX. Si cruza la API, viene
   de `@repo/schemas`; si es local, vive junto al componente de formulario.
2. **`useForm` solo en el componente de formulario**, nunca en el padre.
3. **El formulario recibe `onSubmit` como prop.** El padre conecta `mutation.mutateAsync`.
4. **Un componente por formulario.** `ClienteForm`, `MarcaForm`, `ContratoForm`.
5. **`form.formState.isSubmitting`** deshabilita el botón — sin estado local para esto.
6. Usar `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
   de `@repo/ui/components/form`. No `<label>` ni `<p>` sueltos para errores.

---

## Modales — separación obligatoria modal / formulario

**El modal es un contenedor genérico.** El formulario vive en su propio componente
y se pasa como `children`. El modal no gestiona estado de campos, no llama a
`useForm`, no tiene `useState` por campo.

### ❌ PROHIBIDO — modal que mezcla diálogo + estado de formulario

```tsx
// UnidadModal.tsx — anti-patrón
export function UnidadModal({ open, onOpenChange, unidad }) {
  // ❌ Estado del formulario dentro del modal
  const [nombre, setNombre] = React.useState('');
  const [posiciones, setPosiciones] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // ❌ useEffect para "resetear" campos manualmente
  React.useEffect(() => {
    if (!open) return;
    setNombre(unidad?.nombre ?? '');
    setPosiciones(unidad?.posiciones.map((p) => p.nombre) ?? []);
  }, [open, unidad]);

  // ❌ Validación imperativa en handleSubmit
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    await crear({ nombre, posiciones });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* ❌ JSX del formulario hardcodeado dentro del modal */}
        <form onSubmit={handleSubmit}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <button type="submit">Guardar</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### ✅ OBLIGATORIO — modal genérico + formulario separado

**El modal** solo orquesta apertura/cierre y pasa `onSubmit` al formulario:

```tsx
// UnidadModal.tsx — solo orquesta
import { AppModal } from '@/shared/ui/components/AppModal';
import { UnidadForm } from './UnidadForm';
import { useUnidadesCrud } from '../../application/mutations/useUnidadesCrud.mutation';

export function UnidadModal({
  open,
  onOpenChange,
  unidad,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidad?: TUnidad;
}): React.JSX.Element {
  const { crear, actualizar } = useUnidadesCrud();

  async function handleSubmit(datos: UnidadFormValues): Promise<void> {
    if (unidad) {
      await actualizar({ id: unidad.id, datos });
    } else {
      await crear(datos);
    }
    onOpenChange(false);
  }

  return (
    <AppModal
      description="Al guardar, se actualiza automáticamente en Roles, Plantillas y Usuarios"
      onOpenChange={onOpenChange}
      open={open}
      title={unidad ? 'Editar unidad' : 'Nueva unidad'}
    >
      <UnidadForm defaultValues={unidad} onSubmit={handleSubmit} />
    </AppModal>
  );
}
```

**El formulario** tiene `useForm`, el esquema Zod y todo el JSX de campos:

```tsx
// UnidadForm.tsx — dueño del estado de formulario
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@repo/ui/components/form';

export function UnidadForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<UnidadFormValues>;
  onSubmit: (data: UnidadFormValues) => Promise<void>;
}): React.JSX.Element {
  const form = useForm<UnidadFormValues>({
    resolver: zodResolver(unidadFormSchema),
    defaultValues: { nombre: '', posiciones: [], aliasesEntra: [], ...defaultValues },
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la unidad</FormLabel>
              <FormControl>
                <input className={CONTROL_CAMPO} placeholder="Ej. Producto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... más campos ... */}
        <ModalFooter
          guardando={form.formState.isSubmitting}
          guardarLabel="Guardar unidad"
          onCancelar={onCancelar}
        />
      </form>
    </Form>
  );
}
```

**`AppModal`** es el wrapper genérico reutilizable en `src/shared/ui/components/`:

```tsx
// AppModal.tsx
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@repo/ui/components/dialog';

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'sm:max-w-[640px]',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}): React.JSX.Element {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={cn('max-h-[85vh] overflow-y-auto', maxWidth)}>
        <DialogHeader className="-mx-6 -mt-6 mb-1 border-gray-200 border-b px-6 pt-5 pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### Reglas de modales

1. **Un modal = `AppModal` (contenedor) + `<Feature>Form` (formulario).** Nunca los dos en un solo componente.
2. **El modal conecta la mutation y pasa `onSubmit` al formulario.** No gestiona campos.
3. **El formulario usa `useForm` + `zodResolver`.** El modal no sabe nada de RHF.
4. **`onCancelar`** lo pasa el modal como `() => onOpenChange(false)` al formulario.
5. **Si el formulario necesita datos async** (catálogos, etc.), el modal los busca con
   `useQuery` y los pasa como props al formulario — el formulario no llama a hooks
   de datos directamente.
6. **`form.reset(defaultValues)` en el formulario** cuando cambian las `defaultValues`
   (con `useEffect` o `key` prop en el modal) — no `useState` por campo para resetear.

---

## Qué NO va en `src/shared/ui/components/`

- Componentes específicos de una sola feature → van en `features/<feature>/ui/`.
- Primitivos genéricos sin lógica de app → van en `@repo/ui`.
- Lógica de negocio, fetch, transformaciones → van en `domain/`, `application/` o
  `infrastructure/`.
