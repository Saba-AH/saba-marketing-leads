import React from 'react';

/** Nombre principal de una fila (`.dt-name`). */
export function DataTableName({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className="font-bold text-[13.5px]">{children}</div>;
}
