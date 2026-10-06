import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableHead({
  className,
  ...props
}: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground',
        className
      )}
      data-slot="table-head"
      {...props}
    />
  );
}
