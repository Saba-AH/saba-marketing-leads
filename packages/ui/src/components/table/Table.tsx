'use client';

import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

/**
 * El contenedor con `overflow-x-auto` es parte del componente: una tabla con
 * más columnas que ancho disponible debe scrollear ella sola, sin empujar el
 * scroll horizontal a la página.
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
