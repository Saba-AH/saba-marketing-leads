import type { LucideIcon } from 'lucide-react';
import React from 'react';

/** Un dato de la ficha con su ícono; no se muestra si Saba no lo tiene. */
export function DatoCliente({
  icono: Icono,
  etiqueta,
  valor,
  accion,
}: {
  icono: LucideIcon;
  etiqueta: string;
  valor: string | null;
  /** Botón al costado (p. ej. copiar). */
  accion?: React.ReactNode;
}): React.JSX.Element | null {
  if (!valor) return null;
  return (
    <div className="flex items-start gap-3">
      <Icono
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="break-all text-sm">{valor}</span>
        <span className="text-muted-foreground text-xs">{etiqueta}</span>
      </div>
      {accion}
    </div>
  );
}
