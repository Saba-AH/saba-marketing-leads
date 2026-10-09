'use client';

import { TableCell, TableRow } from '@repo/ui/components/table';
import React from 'react';

interface DataTableRowProps {
  /** Accessible name of the action, e.g. "Editar cliente Acme". */
  action: string;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Clickable row (`.dt-row`). Each child is a cell.
 *
 * It used to be a `<button>` containing `role="cell"`: it gave an accessible
 * name, but a button cannot contain cells and the table was not a table. Now
 * it is a real `<tr>`, focusable and operable with Enter or Space — the
 * keyboard reaches the same action as the mouse with no invalid markup in
 * between.
 */
export function DataTableRow({
  action,
  onClick,
  children,
}: DataTableRowProps): React.JSX.Element {
  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTableRowElement>
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <TableRow
      aria-label={action}
      className="cursor-pointer hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {React.Children.map(children, (cell) => (
        <TableCell className="whitespace-normal px-[18px] py-[13px] align-middle">
          {cell}
        </TableCell>
      ))}
    </TableRow>
  );
}
