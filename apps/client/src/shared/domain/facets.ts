/**
 * Filters derived from the data the table already shows.
 *
 * A facet does not declare its options: it declares **how to read** an item's
 * value, and from that come both the options (the distinct values that exist)
 * and the filtering (which items have the chosen value). One function for both,
 * so they cannot drift apart — which is what happens with a hand-written list
 * of options.
 */
export interface Facet<T> {
  id: string;
  label: string;
  /** A few closed options go in chips; what grows with the data, in a select. */
  presentation: 'chips' | 'select';
  /** The item's value or values. Empty = the item does not take part in the facet. */
  valuesOf: (item: T) => string | readonly string[] | null | undefined;
}

/** Nothing chosen. It is the empty string so the `<select>` can represent it. */
export const NO_FILTER = '';

export type FilterSelection = Readonly<Record<string, string>>;

function normalizedValues<T>(facet: Facet<T>, item: T): string[] {
  const raw = facet.valuesOf(item);
  if (raw === null || raw === undefined) {
    return [];
  }
  const list = typeof raw === 'string' ? [raw] : raw;
  return list.map((value) => value.trim()).filter(Boolean);
}

/**
 * Two spellings that only differ in case are the same value for a person:
 * "Acme" and "acme" are the same brand. Comparing them as-is offered them as
 * two options, and choosing one left the other out (#144).
 */
function keyOf(value: string): string {
  return value.toLocaleLowerCase('es');
}

/**
 * The distinct values that exist today, sorted the way a person would read
 * them.
 *
 * They are grouped case-insensitively, but the **first spelling found** is
 * shown: showing "acme" when the table says "Acme" would be worse than the
 * problem this solves.
 */
export function facetOptions<T>(
  items: readonly T[],
  facet: Facet<T>
): string[] {
  const byKey = new Map<string, string>();
  for (const item of items) {
    for (const value of normalizedValues(facet, item)) {
      const key = keyOf(value);
      if (!byKey.has(key)) {
        byKey.set(key, value);
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Facets combine with each other using AND: each one narrows the previous. */
export function applyFilters<T>(
  items: readonly T[],
  facets: readonly Facet<T>[],
  selection: FilterSelection
): T[] {
  return items.filter((item) =>
    facets.every((facet) => {
      const chosen = selection[facet.id];
      if (!chosen) {
        return true;
      }
      // By key, just like the options: choosing "Acme" has to bring the "acme" ones
      // too.
      const searched = keyOf(chosen);
      return normalizedValues(facet, item).some(
        (value) => keyOf(value) === searched
      );
    })
  );
}
