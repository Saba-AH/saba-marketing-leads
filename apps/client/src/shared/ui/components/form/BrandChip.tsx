'use client';

import { X } from 'lucide-react';
import React from 'react';

/**
 * Chip de un valor agregado a una lista (`.brand-chip` del prototipo): morado
 * claro, con su ✕ para quitarlo. Lo usan Posiciones, Alias de Entra y Marcas.
 */
export function BrandChip({
  label,
  onQuitar,
  quitando,
  children,
}: {
  label: string;
  onQuitar: () => void;
  /**
   * Quitar este chip está saliendo a la API (Marcas, #95). Los chips que solo
   * mueven estado local —Posiciones, Alias de Entra— lo omiten.
   */
  quitando?: boolean;
  /** Contenido extra antes del texto, p. ej. el logo de una Marca. */
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <span className="mr-2 mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-[12px] text-brand-700">
      {children}
      {label}
      <button
        aria-label={`Quitar ${label}`}
        className="cursor-pointer font-extrabold text-brand-600 disabled:cursor-wait disabled:opacity-50"
        disabled={quitando}
        onClick={onQuitar}
        type="button"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
