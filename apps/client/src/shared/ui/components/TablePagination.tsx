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
import { visiblePages } from '@/shared/domain/pagination';

interface TablePaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  from: number;
  until: number;
  total: number;
  /** Plural of what is listed, e.g. "clientes". */
  pluralName: string;
}

/**
 * With a single page it does not render: a control that cannot do anything is
 * noise. The count does not help either if what you see is all there is.
 */
export function TablePagination({
  page,
  pageCount,
  onChange,
  from,
  until,
  total,
  pluralName,
}: TablePaginationProps): React.JSX.Element | null {
  if (pageCount <= 1) {
    return null;
  }

  const items = visiblePages(page, pageCount);

  return (
    <div className="mt-3.5 flex items-center justify-between gap-4">
      <p className="text-[12.5px] text-muted-foreground">
        Mostrando {from}–{until} de {total} {pluralName}
      </p>

      <Pagination className="w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationButton
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => onChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </PaginationButton>
          </PaginationItem>

          {items.map((item, index) =>
            item === 'ellipsis' ? (
              // There can be two ellipses and neither has its own identity: what tells them
              // apart is where they fall.
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationButton
                  active={item === page}
                  aria-label={`Página ${item}`}
                  onClick={() => onChange(item)}
                >
                  {item}
                </PaginationButton>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationButton
              aria-label="Página siguiente"
              disabled={page === pageCount}
              onClick={() => onChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </PaginationButton>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
