'use client';

import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

/**
 * The `overflow-x-auto` container is part of the component: a table with more
 * columns than available width must scroll on its own, without pushing
 * horizontal scroll onto the page.
 */
export default function Table({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div
      className="relative w-full overflow-x-auto"
      data-slot="table-container"
    >
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}
