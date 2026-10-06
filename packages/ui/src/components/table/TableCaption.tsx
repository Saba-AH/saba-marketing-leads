import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('mt-4 text-muted-foreground text-sm', className)}
      data-slot="table-caption"
      {...props}
    />
  );
}
