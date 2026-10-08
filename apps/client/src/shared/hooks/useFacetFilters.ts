'use client';

import React from 'react';
import {
  applyFilters,
  type Facet,
  type FilterSelection,
  facetOptions,
  NO_FILTER,
} from '@/shared/domain/facets';

interface FacetFilters<T> {
  /** Available options per facet, derived from the data. */
  options: Readonly<Record<string, string[]>>;
  selection: FilterSelection;
  choose: (facetId: string, value: string) => void;
  clear: () => void;
  hasActiveFilter: boolean;
  filtered: T[];
}

/**
 * Options come from the full set, not the filtered one: if they were
 * recomputed over the filtered set, choosing "Colombia" would drop "México"
 * from the list and there would be no way to switch countries without clearing
 * first.
 *
 * `facets` must be a module constant. Declared inline it would be a new
 * reference on every render and the memos would be useless.
 */
export function useFacetFilters<T>(
  items: readonly T[],
  facets: readonly Facet<T>[]
): FacetFilters<T> {
  const [selection, setSelection] = React.useState<FilterSelection>({});

  const options = React.useMemo(() => {
    const byFacet: Record<string, string[]> = {};
    for (const facet of facets) {
      byFacet[facet.id] = facetOptions(items, facet);
    }
    return byFacet;
  }, [items, facets]);

  const filtered = React.useMemo(
    () => applyFilters(items, facets, selection),
    [items, facets, selection]
  );

  const choose = React.useCallback((facetId: string, value: string): void => {
    setSelection((actual) => ({ ...actual, [facetId]: value }));
  }, []);

  const clear = React.useCallback((): void => setSelection({}), []);

  const hasActiveFilter = Object.values(selection).some(
    (value) => value !== NO_FILTER
  );

  return { options, selection, choose, clear, hasActiveFilter, filtered };
}
