import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableCell({
  className,
  ...props
}: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('p-2 align-middle', className)}
      data-slot="table-cell"
      {...props}
    />
  );
}
