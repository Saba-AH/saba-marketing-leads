'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';
import { SIN_FILTRO } from '@/shared/domain/facetas';

interface FiltroSelectProps {
  label: string;
  opciones: readonly string[];
  valor: string;
  onChange: (valor: string) => void;
  /** Texto de "sin filtro", p. ej. "Todos los países". */
  etiquetaTodos: string;
}

/**
 * Faceta cuyas opciones crecen con los datos (países, marcas): en chips
 * desbordaría la fila.
 *
 * Sin opciones no se renderiza: un filtro vacío es ruido, no una función.
 */
export function FiltroSelect({
  label,
  opciones,
  valor,
  onChange,
  etiquetaTodos,
}: FiltroSelectProps): React.JSX.Element | null {
  const id = React.useId();

  if (opciones.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        className="cursor-pointer appearance-none rounded-full border border-border bg-card py-1.5 pr-7 pl-3 font-semibold text-[12.5px] text-foreground/80 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        id={id}
        onChange={(evento) => onChange(evento.target.value)}
        value={valor}
      >
        <option value={SIN_FILTRO}>{etiquetaTodos}</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
    </div>
  );
}
