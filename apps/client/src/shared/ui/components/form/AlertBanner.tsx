'use client';

import { TriangleAlert, X } from 'lucide-react';
import React from 'react';

/**
 * Banner de error en línea (`.alert-banner` del prototipo). Reemplaza al
 * `Alert` de shadcn en los modales: el repo prohíbe `alert()` nativo y este es
 * el componente con el que la maqueta resuelve las validaciones.
 */
export function AlertBanner({
  mensaje,
  onCerrar,
}: {
  mensaje: string;
  onCerrar?: () => void;
}): React.JSX.Element {
  return (
    <div
      className="mb-2 flex items-start gap-2.5 rounded-md border border-error-200 bg-error-100 px-3.5 py-3 font-semibold text-[12.5px] text-error-600"
      role="alert"
    >
      <TriangleAlert className="mt-px size-[17px] shrink-0" />
      <div>{mensaje}</div>
      {onCerrar && (
        <button
          aria-label="Cerrar aviso"
          className="ml-auto shrink-0 cursor-pointer opacity-60 hover:opacity-100"
          onClick={onCerrar}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
