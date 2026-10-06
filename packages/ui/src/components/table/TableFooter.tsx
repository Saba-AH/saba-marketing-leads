import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableFooter({
  className,
  ...props
}: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}
