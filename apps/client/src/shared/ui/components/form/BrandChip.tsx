'use client';

import { X } from 'lucide-react';
import React from 'react';

/**
 * Chip for a value added to a list (the prototype's `.brand-chip`): light
 * purple, with its ✕ to remove it. Used by Positions, Entra Aliases and Brands.
 */
export function BrandChip({
  label,
  onRemove,
  removing,
  children,
}: {
  label: string;
  onRemove: () => void;
  /**
   * Removing this chip is going out to the API (Brands, #95). Chips that only
   * move local state —Positions, Entra Aliases— omit it.
   */
  removing?: boolean;
  /** Extra content before the text, e.g. a Brand's logo. */
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <span className="mr-2 mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-[12px] text-brand-700">
      {children}
      {label}
      <button
        aria-label={`Quitar ${label}`}
        className="cursor-pointer font-extrabold text-brand-600 disabled:cursor-wait disabled:opacity-50"
        disabled={removing}
        onClick={onRemove}
        type="button"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
