'use client';

import React from 'react';

/**
 * Botón de alta de un bloque repetible (`.add-grant-btn` del prototipo): ancho
 * completo, borde punteado, y morado al pasar por encima. Lo usa "+ Agregar
 * país" y lo van a usar las filas de concesión de #57/#58.
 */
export function BotonAgregarBloque({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      className="w-full cursor-pointer rounded-md border-[1.5px] border-gray-300 border-dashed py-2.5 font-bold text-[12.5px] text-gray-600 transition-colors hover:border-brand-600 hover:bg-brand-50 hover:text-brand-600"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
