import { cn } from '@repo/ui/lib/utils';
import React from 'react';

interface ProximamenteProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Envuelve una opción/sección completa para mostrarla deshabilitada con un
 * badge "Próximamente". `inert` saca a los hijos del tab order y bloquea
 * mouse/teclado a nivel de plataforma; el `onClickCapture` es una segunda
 * capa que no depende de que jsdom (tests) implemente ese comportamiento.
 */
export function Proximamente({ children, className }: ProximamenteProps) {
  return (
    <div
      aria-disabled="true"
      inert
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      className={cn('relative inline-block cursor-not-allowed', className)}
    >
      <div className="pointer-events-none opacity-50">{children}</div>
      <span className="-top-2 -right-2 absolute rounded-full bg-utility-brand-100 px-2 py-0.5 text-[10px] font-semibold txt-brand-secondary-700">
        Próximamente
      </span>
    </div>
  );
}
