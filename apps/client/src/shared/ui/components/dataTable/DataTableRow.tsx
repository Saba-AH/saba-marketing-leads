'use client';

import { TableCell, TableRow } from '@repo/ui/components/table';
import React from 'react';

interface DataTableRowProps {
  /** Nombre accesible de la acción, p. ej. "Editar cliente Acme". */
  accion: string;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Fila clickeable (`.dt-row`). Cada hijo es una celda.
 *
 * Antes era un `<button>` conteniendo `role="cell"`: daba un nombre accesible,
 * pero un botón no puede contener celdas y la tabla no era una tabla. Ahora es
 * un `<tr>` real, focalizable y operable con Enter o Espacio — el teclado llega
 * a la misma acción que el mouse sin markup inválido de por medio.
 */
export function DataTableRow({
  accion,
  onClick,
  children,
}: DataTableRowProps): React.JSX.Element {
  function handleKeyDown(
    evento: React.KeyboardEvent<HTMLTableRowElement>
  ): void {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      onClick();
    }
  }

  return (
    <TableRow
      aria-label={accion}
      className="cursor-pointer hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {React.Children.map(children, (celda) => (
        <TableCell className="whitespace-normal px-[18px] py-[13px] align-middle">
          {celda}
        </TableCell>
      ))}
    </TableRow>
  );
}
