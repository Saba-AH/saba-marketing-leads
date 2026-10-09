'use client';

import React from 'react';

/**
 * How many columns the table has. `DataTable` declares it once and
 * `DataTableMessage` consumes it, since it needs the `colSpan` so an empty or
 * error state takes the full width instead of the first cell.
 */
export const DataTableContext = React.createContext<number>(1);

export function useColumnCount(): number {
  return React.useContext(DataTableContext);
}
