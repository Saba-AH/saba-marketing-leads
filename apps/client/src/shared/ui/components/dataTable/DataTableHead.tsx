'use client';

import { TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import React from 'react';

/** Fila de encabezados (`.dt-row.head`). Cada hijo es una columna. */
export function DataTableHead({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <TableHeader>
      <TableRow className="bg-muted hover:bg-muted">
        {React.Children.map(children, (celda) => (
          <TableHead className="h-auto px-[18px] py-2.5 font-bold text-[11px] text-muted-foreground uppercase tracking-[0.03em]">
            {celda}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
