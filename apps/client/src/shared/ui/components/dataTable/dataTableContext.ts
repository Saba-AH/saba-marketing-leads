'use client';

import React from 'react';

/**
 * Cuántas columnas tiene la tabla. Lo declara `DataTable` una vez y lo consume
 * `DataTableMessage`, que necesita el `colSpan` para que un estado vacío o de
 * error ocupe el ancho completo en vez de la primera celda.
 */
export const DataTableContext = React.createContext<number>(1);

export function useCantidadColumnas(): number {
  return React.useContext(DataTableContext);
}
