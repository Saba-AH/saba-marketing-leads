'use client';

import React from 'react';
import { SIN_FILTRO } from '@/shared/domain/facetas';
import { FilterChip } from './FilterChip';

interface FiltroChipsProps {
  label: string;
  opciones: readonly string[];
  valor: string;
  onChange: (valor: string) => void;
  /** Etiqueta de "sin filtro". Por defecto "Todos". */
  etiquetaTodos?: string;
}

/**
 * Faceta de pocas opciones, como chips (`.filter-chip` del prototipo).
 *
 * El grupo lleva su propio nombre accesible porque los chips solos no dicen de
 * qué se está filtrando: "Internos" no significa nada sin "Tipo".
 */
export function FiltroChips({
  label,
  opciones,
  valor,
  onChange,
  etiquetaTodos = 'Todos',
}: FiltroChipsProps): React.JSX.Element {
  return (
    <div aria-label={label} className="flex gap-2" role="group">
      <FilterChip
        activo={valor === SIN_FILTRO}
        label={etiquetaTodos}
        onClick={() => onChange(SIN_FILTRO)}
      />
      {opciones.map((opcion) => (
        <FilterChip
          activo={valor === opcion}
          key={opcion}
          label={opcion}
          onClick={() => onChange(opcion)}
        />
      ))}
    </div>
  );
}
