import { cn } from '@repo/ui/lib/utils';
import React from 'react';

/** Línea secundaria bajo el nombre (`.dt-sub`). */
export function DataTableSub({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn('mt-0.5 text-[11.5px] text-muted-foreground', className)}
    >
      {children}
    </div>
  );
}
