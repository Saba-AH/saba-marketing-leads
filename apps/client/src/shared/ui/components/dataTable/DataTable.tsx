'use client';

import { Table } from '@repo/ui/components/table';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { DataTableBody } from './DataTableBody';
import { DataTableMessage } from './DataTableMessage';
import { DataTableContext } from './dataTableContext';

interface DataTableProps {
  /** Opcional: mientras carga, la tabla es solo el contenedor con su aviso. */
  children?: React.ReactNode;
  /**
   * Reparto de columnas en unidades `fr`, como en el prototipo
   * (`'1.8fr 1.1fr 1fr'`). Se omite cuando la tabla es una ficha de una sola
   * columna (Estructura).
   */
  columnas?: string;
  cargando?: boolean;
  className?: string;
}

/**
 * Una tabla no entiende `fr`, así que los pesos del prototipo se traducen a
 * porcentajes sobre un `<colgroup>`. Mantener la misma prop evita reescribir
 * el reparto de cada pantalla, y con `table-fixed` el ancho lo manda el
 * colgroup y no el contenido de las celdas.
 */
function anchosDesdeColumnas(columnas: string): string[] {
  const pesos = columnas
    .trim()
    .split(/\s+/)
    .map((peso) => Number.parseFloat(peso))
    .filter((peso) => !Number.isNaN(peso));

  const total = pesos.reduce((suma, peso) => suma + peso, 0);
  if (total === 0) {
    return [];
  }

  return pesos.map((peso) => `${((peso / total) * 100).toFixed(4)}%`);
}

/** Tarjeta contenedora de un listado (`.data-table` del prototipo). */
export function DataTable({
  children,
  columnas,
  cargando,
  className,
}: DataTableProps): React.JSX.Element {
  const anchos = columnas ? anchosDesdeColumnas(columnas) : [];
  const cantidadColumnas = anchos.length || 1;

  return (
    <DataTableContext.Provider value={cantidadColumnas}>
      <div
        className={cn(
          'overflow-hidden rounded-[10px] border border-border bg-card',
          className
        )}
      >
        <Table className="table-fixed">
          {anchos.length > 0 && (
            <colgroup>
              {/* Una columna se identifica por su posición: dos pueden
                  compartir ancho, y el orden nunca cambia en vida de la tabla. */}
              {anchos.map((ancho, indice) => (
                <col key={indice} style={{ width: ancho }} />
              ))}
            </colgroup>
          )}

          {children}

          {cargando && (
            <DataTableBody>
              <DataTableMessage className="px-[18px] py-4 text-muted-foreground text-sm">
                Cargando…
              </DataTableMessage>
            </DataTableBody>
          )}
        </Table>
      </div>
    </DataTableContext.Provider>
  );
}
