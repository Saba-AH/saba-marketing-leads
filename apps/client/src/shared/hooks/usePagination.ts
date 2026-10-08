'use client';

import React from 'react';
import { countPages, ITEMS_PER_PAGE } from '@/shared/domain/pagination';

interface TablePagination<T> {
  /** The items of the current page. */
  visible: T[];
  page: number;
  pageCount: number;
  goTo: (page: number) => void;
  /** Human index of the page's first and last item, for "Mostrando X–Y". */
  from: number;
  until: number;
  total: number;
}

/**
 * `key` describes the criteria that produced the list (filters + search).
 * When it changes we go back to page 1: without that, someone on page 4 who
 * filters down to a single page would see an empty list without understanding
 * why.
 *
 * It is adjusted during render and not in an effect, so the invalid page never
 * gets painted.
 */
export function usePagination<T>(
  items: readonly T[],
  key: string
): TablePagination<T> {
  const [page, setPage] = React.useState(1);
  const [previousKey, setPreviousKey] = React.useState(key);

  if (key !== previousKey) {
    setPreviousKey(key);
    setPage(1);
  }

  const pageCount = countPages(items.length);
  // If the data shrinks below the current page (someone deleted a record), the
  // last valid page wins.
  const currentPage = Math.min(page, pageCount);

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const visible = items.slice(start, start + ITEMS_PER_PAGE);

  return {
    visible,
    page: currentPage,
    pageCount,
    goTo: setPage,
    from: items.length === 0 ? 0 : start + 1,
    until: start + visible.length,
    total: items.length,
  };
}
