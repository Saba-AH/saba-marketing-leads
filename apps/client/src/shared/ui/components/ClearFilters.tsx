'use client';

import { X } from 'lucide-react';
import React from 'react';

/**
 * With several active facets, going back to the full list would require
 * setting each one to "Todos" separately. It only shows up when there is
 * something to clear.
 */
export function ClearFilters({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}): React.JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <button
      className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 font-semibold text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
      onClick={onClick}
      type="button"
    >
      <X className="size-3" />
      Limpiar filtros
    </button>
  );
}
