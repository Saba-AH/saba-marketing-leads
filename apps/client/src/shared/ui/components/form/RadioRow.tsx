'use client';

import React from 'react';

/** Fila de opciones excluyentes (`.radio-row` del prototipo). */
export function RadioRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div aria-label={label} className="flex gap-2" role="radiogroup">
      {children}
    </div>
  );
}
