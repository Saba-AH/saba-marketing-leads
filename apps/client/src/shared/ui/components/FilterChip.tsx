'use client';

import React from 'react';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/** The prototype's filter chip (`.filter-chip`): black when active. */
export function FilterChip({
  label,
  active,
  onClick,
}: FilterChipProps): React.JSX.Element {
  return (
    <button
      aria-pressed={active}
      className={`cursor-pointer rounded-full px-3 py-1.5 font-semibold text-[12.5px] ${
        active
          ? 'border border-gray-950 bg-gray-950 text-white'
          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
