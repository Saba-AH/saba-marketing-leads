'use client';

import React from 'react';

interface FilterChipProps {
  label: string;
  activo: boolean;
  onClick: () => void;
}

/** Chip de filtro del prototipo (`.filter-chip`): activo en negro. */
export function FilterChip({
  label,
  activo,
  onClick,
}: FilterChipProps): React.JSX.Element {
  return (
    <button
      aria-pressed={activo}
      className={`cursor-pointer rounded-full px-3 py-1.5 font-semibold text-[12.5px] ${
        activo
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
