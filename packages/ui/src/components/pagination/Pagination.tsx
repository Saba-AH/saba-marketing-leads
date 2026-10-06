import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function Pagination({
  className,
  ...props
}: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label="Paginación"
      className={cn('flex w-full justify-center', className)}
      data-slot="pagination"
      {...props}
    />
  );
}
