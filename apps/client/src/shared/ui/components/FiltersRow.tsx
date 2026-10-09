import React from 'react';

/**
 * Filters row (`.filters-row`). It is what pushes the search box to the far
 * right, so `SearchBox` does not have to carry its own position.
 */
export function FiltersRow({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="mb-4 flex items-center gap-2 [&>*:last-child]:ml-auto">
      {children}
    </div>
  );
}
