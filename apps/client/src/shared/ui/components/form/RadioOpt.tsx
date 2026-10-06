'use client';

import React from 'react';

/**
 * Opción de una `RadioRow` (`.radio-opt` del prototipo): una caja que ocupa su
 * mitad de la fila y se pinta de morado al elegirla. No es un `input[type=radio]`
 * nativo — el prototipo no usa el control del navegador.
 *
 * Es un `button` con `role="radio"` para que siga siendo un grupo de radios
 * para quien navegue con teclado o lector de pantalla, que es lo único que el
 * prototipo, al ser `div`s con `onclick`, no resolvía.
 */
export function RadioOpt({
  label,
  seleccionado,
  onSelect,
}: {
  label: string;
  seleccionado: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <button
      aria-checked={seleccionado}
      className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-3 py-2.5 text-center font-semibold text-[12.5px] transition-colors ${
        seleccionado
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      {label}
    </button>
  );
}
