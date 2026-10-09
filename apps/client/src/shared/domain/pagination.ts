/**
 * Client-side pagination: the API returns the whole collection and slicing it
 * on the server is a separate backend ticket. It is applied **after** searching
 * and filtering — on the raw list, page 2 would show items the filter excluded.
 */
export const ITEMS_PER_PAGE = 10;

/** How many numbers are shown before falling back to an ellipsis. */
const MAX_WITHOUT_ELLIPSIS = 7;

export type PaginationEntry = number | 'ellipsis';

export function countPages(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / ITEMS_PER_PAGE));
}

/**
 * The numbers to draw. Always the first, the last and the current one with its
 * neighbor on each side: that way the control's width does not grow with the
 * data and the relative position is still understandable.
 */
export function visiblePages(actual: number, total: number): PaginationEntry[] {
  if (total <= MAX_WITHOUT_ELLIPSIS) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, actual]);
  if (actual - 1 > 1) {
    pages.add(actual - 1);
  }
  if (actual + 1 < total) {
    pages.add(actual + 1);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PaginationEntry[] = [];

  for (const [index, page] of sorted.entries()) {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  }

  return items;
}
