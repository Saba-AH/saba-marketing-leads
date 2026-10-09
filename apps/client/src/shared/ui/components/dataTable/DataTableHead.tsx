'use client';

import { TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import React from 'react';

/** Header row (`.dt-row.head`). Each child is a column. */
export function DataTableHead({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <TableHeader>
      <TableRow className="bg-muted hover:bg-muted">
        {React.Children.map(children, (cell) => (
          <TableHead className="h-auto px-[18px] py-2.5 font-bold text-[11px] text-muted-foreground uppercase tracking-[0.03em]">
            {cell}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
