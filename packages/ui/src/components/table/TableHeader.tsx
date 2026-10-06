import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableHeader({
  className,
  ...props
}: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('[&_tr]:border-b', className)}
      data-slot="table-header"
      {...props}
    />
  );
}
