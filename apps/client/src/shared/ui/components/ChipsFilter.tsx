'use client';

import React from 'react';
import { NO_FILTER } from '@/shared/domain/facets';
import { FilterChip } from './FilterChip';

interface ChipsFilterProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** Label for "no filter". Defaults to "Todos". */
  allLabel?: string;
}

/**
 * Facet with few options, as chips (`.filter-chip` in the prototype).
 *
 * The group carries its own accessible name because the chips alone do not say
 * what is being filtered: "Internos" means nothing without "Tipo".
 */
export function ChipsFilter({
  label,
  options,
  value,
  onChange,
  allLabel = 'Todos',
}: ChipsFilterProps): React.JSX.Element {
  return (
    <div aria-label={label} className="flex gap-2" role="group">
      <FilterChip
        active={value === NO_FILTER}
        label={allLabel}
        onClick={() => onChange(NO_FILTER)}
      />
      {options.map((option) => (
        <FilterChip
          active={value === option}
          key={option}
          label={option}
          onClick={() => onChange(option)}
        />
      ))}
    </div>
  );
}
