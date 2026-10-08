'use client';

import { Search } from 'lucide-react';
import React from 'react';

interface SearchBoxProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * The prototype's search box (`.search-box`): 220px, pushed to the far right of
 * its row with `ml-auto` and with the magnifier inside the field.
 */
export function SearchBox({
  label,
  placeholder,
  value,
  onChange,
}: SearchBoxProps): React.JSX.Element {
  return (
    <div className="flex w-[220px] items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5">
      <Search className="size-3.5 shrink-0 text-gray-400" />
      <input
        aria-label={label}
        className="w-full bg-transparent text-[12.5px] text-gray-900 outline-none placeholder:text-gray-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
