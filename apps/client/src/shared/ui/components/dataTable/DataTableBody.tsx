import { TableBody } from '@repo/ui/components/table';
import React from 'react';

/** Cuerpo de la tabla (`<tbody>`). Agrupa las filas y los avisos. */
export function DataTableBody({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <TableBody>{children}</TableBody>;
}
