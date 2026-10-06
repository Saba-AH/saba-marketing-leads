import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export default function TableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      data-slot="table-body"
      {...props}
    />
  );
}
