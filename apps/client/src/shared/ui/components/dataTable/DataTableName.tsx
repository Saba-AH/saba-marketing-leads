import React from 'react';

/** A row's main name (`.dt-name`). */
export function DataTableName({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className="font-bold text-[13.5px]">{children}</div>;
}
