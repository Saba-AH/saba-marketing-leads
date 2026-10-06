import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableRow({
  className,
  ...props
}: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      data-slot="table-row"
      {...props}
    />
  );
}
