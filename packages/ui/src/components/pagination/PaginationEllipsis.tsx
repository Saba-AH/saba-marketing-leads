import { cn } from '@repo/ui/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import * as React from 'react';

export default function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex size-9 items-center justify-center', className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  );
}
