'use client';

import { TableCell, TableRow } from '@repo/ui/components/table';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { useCantidadColumnas } from './dataTableContext';

/**
 * Aviso que ocupa el ancho completo de la tabla: cargando, error o listado
 * vacío. Dentro de un `<tbody>` no puede ir cualquier cosa, así que el mensaje
 * viaja en una fila con `colSpan` en vez de suelto en la tarjeta.
 */
export function DataTableMessage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const cantidadColumnas = useCantidadColumnas();

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        className={cn('whitespace-normal', className)}
        colSpan={cantidadColumnas}
      >
        {children}
      </TableCell>
    </TableRow>
  );
}
