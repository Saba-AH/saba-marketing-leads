'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';
import { NO_FILTER } from '@/shared/domain/facets';

interface SelectFilterProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** "No filter" text, e.g. "Todos los países". */
  allLabel: string;
}

/**
 * Facet whose options grow with the data (countries, brands): as chips it
 * would overflow the row.
 *
 * With no options it does not render: an empty filter is noise, not a feature.
 */
export function SelectFilter({
  label,
  options,
  value,
  onChange,
  allLabel,
}: SelectFilterProps): React.JSX.Element | null {
  const id = React.useId();

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        className="cursor-pointer appearance-none rounded-full border border-border bg-card py-1.5 pr-7 pl-3 font-semibold text-[12.5px] text-foreground/80 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value={NO_FILTER}>{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
    </div>
  );
}
