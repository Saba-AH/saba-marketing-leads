import { applyFilters, type Facet, facetOptions } from '@/shared/domain/facets';

interface Customer {
  name: string;
  brands: string[];
}

const BRAND: Facet<Customer> = {
  id: 'brand',
  label: 'Marca',
  presentation: 'select',
  valuesOf: (customer) => customer.brands,
};

const CUSTOMERS: Customer[] = [
  { name: 'Uno', brands: ['Acme'] },
  { name: 'Dos', brands: ['acme'] },
  { name: 'Tres', brands: ['  Beta  '] },
  { name: 'Cuatro', brands: [] },
];

describe('facetOptions', () => {
  it('groups spellings that only differ in case', () => {
    // The database index is case-sensitive, so "Acme" and "acme" can coexist as
    // two brands — for a person they are the same (#144).
    expect(facetOptions(CUSTOMERS, BRAND)).toEqual(['Acme', 'Beta']);
  });

  it('shows the first spelling found, not the lowercase one', () => {
    // Showing "acme" when the table says "Acme" would be worse than the problem.
    const reversed = [CUSTOMERS[1], CUSTOMERS[0]] as Customer[];
    expect(facetOptions(reversed, BRAND)).toEqual(['acme']);
  });

  it('trims spaces and drops empty values', () => {
    expect(
      facetOptions([{ name: 'X', brands: ['  ', 'Zeta'] }], BRAND)
    ).toEqual(['Zeta']);
  });

  it('an item without values contributes no options', () => {
    expect(facetOptions([CUSTOMERS[3] as Customer], BRAND)).toEqual([]);
  });
});

describe('applyFilters', () => {
  it('choosing one spelling also brings the others', () => {
    const filtered = applyFilters(CUSTOMERS, [BRAND], { brand: 'Acme' });

    expect(filtered.map((customer) => customer.name)).toEqual(['Uno', 'Dos']);
  });

  it('with no selection it filters nothing', () => {
    expect(applyFilters(CUSTOMERS, [BRAND], {})).toHaveLength(4);
    expect(applyFilters(CUSTOMERS, [BRAND], { brand: '' })).toHaveLength(4);
  });

  it('facets combine with AND', () => {
    const name: Facet<Customer> = {
      id: 'name',
      label: 'Nombre',
      presentation: 'select',
      valuesOf: (customer) => customer.name,
    };

    const filtered = applyFilters(CUSTOMERS, [BRAND, name], {
      brand: 'acme',
      name: 'Dos',
    });

    expect(filtered.map((customer) => customer.name)).toEqual(['Dos']);
  });
});
