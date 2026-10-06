import React from 'react';

/**
 * Fila de filtros (`.filters-row`). Es quien empuja el buscador al extremo
 * derecho, para que `SearchBox` no cargue con su propia posición.
 */
export function FiltersRow({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="mb-4 flex items-center gap-2 [&>*:last-child]:ml-auto">
      {children}
    </div>
  );
}
