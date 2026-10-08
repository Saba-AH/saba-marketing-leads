'use client';

import { Table } from '@repo/ui/components/table';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { DataTableBody } from './DataTableBody';
import { DataTableMessage } from './DataTableMessage';
import { DataTableContext } from './dataTableContext';

interface DataTableProps {
  /** Optional: while loading, the table is just the container with its notice. */
  children?: React.ReactNode;
  /**
   * Column split in `fr` units, as in the prototype (`'1.8fr 1.1fr 1fr'`).
   * Omitted when the table is a single-column card (Structure).
   */
  columns?: string;
  loading?: boolean;
  className?: string;
}

/**
 * A table does not understand `fr`, so the prototype's weights are translated
 * into percentages on a `<colgroup>`. Keeping the same prop avoids rewriting
 * every screen's split, and with `table-fixed` the width is driven by the
 * colgroup and not by the cells' content.
 */
function widthsFromColumns(columns: string): string[] {
  const weights = columns
    .trim()
    .split(/\s+/)
    .map((weight) => Number.parseFloat(weight))
    .filter((weight) => !Number.isNaN(weight));

  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) {
    return [];
  }

  return weights.map((weight) => `${((weight / total) * 100).toFixed(4)}%`);
}

/** Container card for a list (the prototype's `.data-table`). */
export function DataTable({
  children,
  columns,
  loading,
  className,
}: DataTableProps): React.JSX.Element {
  const widths = columns ? widthsFromColumns(columns) : [];
  const columnCount = widths.length || 1;

  return (
    <DataTableContext.Provider value={columnCount}>
      <div
        className={cn(
          'overflow-hidden rounded-[10px] border border-border bg-card',
          className
        )}
      >
        <Table className="table-fixed">
          {widths.length > 0 && (
            <colgroup>
              {/* A column is identified by its position: two can share a width,
                  and the order never changes during the table's life. */}
              {widths.map((width, index) => (
                <col key={index} style={{ width: width }} />
              ))}
            </colgroup>
          )}

          {children}

          {loading && (
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
