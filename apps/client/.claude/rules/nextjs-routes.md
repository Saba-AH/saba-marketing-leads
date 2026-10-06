# Estándares para el App Router de Next.js (`src/app/`)

## Separación de responsabilidades

1. **Rutas delegadas**: los archivos `page.tsx` actúan **exclusivamente** como wrappers/entrypoints de las vistas del módulo `features/`.
2. **Sin lógica ni JSX extenso**: `page.tsx` no gestiona estado local, ni declara estilos extensos ni JSX complejo.

```tsx
// ❌ PROHIBIDO (src/app/dashboard/page.tsx con UI directa)
import React from 'react';

export default function Page() {
  return (
    <main className="p-8">
      <h1>Dashboard</h1>
      {/* Decenas de líneas de UI */}
    </main>
  );
}

// ✅ OBLIGATORIO (src/app/dashboard/page.tsx)
import React from 'react';
import { DashboardUI } from '@/features/dashboard/ui/pages/DashboardUI';

export default function DashboardPage() {
  return <DashboardUI />;
}
```

> El cliente es SSR, así que `page.tsx` puede ser Server Component. Aun así se mantiene la delegación: la UI real vive en la vista de la feature. Y el acceso a datos de dominio pasa por `apps/api` (React Query desde el navegador es el patrón por defecto), nunca directo a Postgres/Storage.
