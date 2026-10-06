'use client';

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@repo/ui/components/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { paginasVisibles } from '@/shared/domain/paginacion';

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
  desde: number;
  hasta: number;
  total: number;
  /** Plural de lo que se lista, p. ej. "clientes". */
  nombrePlural: string;
}

/**
 * Con una sola página no se renderiza: un control que no puede hacer nada es
 * ruido. El conteo tampoco aporta si lo que se ve es todo lo que hay.
 */
export function Paginacion({
  pagina,
  totalPaginas,
  onCambiar,
  desde,
  hasta,
  total,
  nombrePlural,
}: PaginacionProps): React.JSX.Element | null {
  if (totalPaginas <= 1) {
    return null;
  }

  const items = paginasVisibles(pagina, totalPaginas);

  return (
    <div className="mt-3.5 flex items-center justify-between gap-4">
      <p className="text-[12.5px] text-muted-foreground">
        Mostrando {desde}–{hasta} de {total} {nombrePlural}
      </p>

      <Pagination className="w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationButton
              aria-label="Página anterior"
              disabled={pagina === 1}
              onClick={() => onCambiar(pagina - 1)}
            >
              <ChevronLeft className="size-4" />
            </PaginationButton>
          </PaginationItem>

          {items.map((item, indice) =>
            item === 'elipsis' ? (
              // Puede haber dos elipsis y ninguna tiene identidad propia: lo
              // que la distingue es dónde cae.
              <PaginationItem key={`elipsis-${indice}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationButton
                  activo={item === pagina}
                  aria-label={`Página ${item}`}
                  onClick={() => onCambiar(item)}
                >
                  {item}
                </PaginationButton>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationButton
              aria-label="Página siguiente"
              disabled={pagina === totalPaginas}
              onClick={() => onCambiar(pagina + 1)}
            >
              <ChevronRight className="size-4" />
            </PaginationButton>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
