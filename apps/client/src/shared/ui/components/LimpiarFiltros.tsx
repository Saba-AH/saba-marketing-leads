'use client';

import { X } from 'lucide-react';
import React from 'react';

/**
 * Con varias facetas activas, volver al listado completo obligaría a poner
 * cada una en "Todos" por separado. Solo aparece cuando hay algo que limpiar.
 */
export function LimpiarFiltros({
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
