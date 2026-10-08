import { TableBody } from '@repo/ui/components/table';
import React from 'react';

/** Table body (`<tbody>`). Groups the rows and the notices. */
export function DataTableBody({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <TableBody>{children}</TableBody>;
}
