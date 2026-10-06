# Reglas para Componentes de React

## Importación de React y Hooks

- **Única importación permitida de React**: se importa únicamente la librería principal (`import React from 'react';`).
- **Acceso a hooks de React**: queda **estrictamente prohibido** importar los hooks propios de React mediante destructuración named. Se invocan directamente desde el namespace `React`.

```tsx
// ❌ PROHIBIDO
import { useState, useEffect } from 'react';

// ✅ OBLIGATORIO
import React from 'react';

export const UserStatus = () => {
  const [isActive, setIsActive] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Lógica del efecto
  }, []);

  return <div>{isActive ? 'Activo' : 'Inactivo'}</div>;
};
```

> Aplica a los hooks **propios de React** (`useState`, `useEffect`, `useMemo`, `useRef`, …). Los hooks de librerías (`useQuery` de React Query) y los hooks propios de la app (`useSystemStatus`) se importan named con normalidad: no viven en el namespace `React`.
