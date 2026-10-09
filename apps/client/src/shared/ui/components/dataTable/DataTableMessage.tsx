'use client';

import { TableCell, TableRow } from '@repo/ui/components/table';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { useColumnCount } from './dataTableContext';

/**
 * Notice spanning the table's full width: loading, error or empty list. Not
 * just anything can go inside a `<tbody>`, so the message travels in a row with
 * `colSpan` instead of loose in the card.
 */
export function DataTableMessage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const columnCount = useColumnCount();

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        className={cn('whitespace-normal', className)}
        colSpan={columnCount}
      >
        {children}
      </TableCell>
    </TableRow>
  );
}
