import { cn } from '@repo/ui/lib/utils';
import React from 'react';

/**
 * Campo de formulario del prototipo (`.field`): etiqueta de 12.5px en negrita
 * gris, el control, y un texto de apoyo opcional debajo.
 *
 * `htmlFor` es opcional porque algunos campos agrupan varios controles (un
 * `RadioRow`, una lista de chips) y no hay uno solo al que apuntar; en ese
 * caso la etiqueta se rinde como texto y el grupo lleva su propio nombre
 * accesible.
 */
export function Campo({
  label,
  htmlFor,
  ayuda,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  ayuda?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-col', className)}>
      {htmlFor ? (
        <label
          className="mb-1.5 block font-bold text-[12.5px] text-gray-700"
          htmlFor={htmlFor}
        >
          {label}
        </label>
      ) : (
        <span className="mb-1.5 block font-bold text-[12.5px] text-gray-700">
          {label}
        </span>
      )}
      {children}
      {ayuda && <p className="mt-1 text-[11px] text-gray-500">{ayuda}</p>}
    </div>
  );
}
