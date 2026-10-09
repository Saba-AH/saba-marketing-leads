'use client';

import React from 'react';

/**
 * Option of a `RadioRow` (the prototype's `.radio-opt`): a box that takes its
 * half of the row and turns purple when chosen. It is not a native
 * `input[type=radio]` — the prototype does not use the browser control.
 *
 * It is a `button` with `role="radio"` so it is still a radio group for
 * keyboard or screen reader users, which is the one thing the prototype, being
 * `div`s with `onclick`, did not solve.
 */
export function RadioOpt({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <button
      aria-checked={selected}
      className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-3 py-2.5 text-center font-semibold text-[12.5px] transition-colors ${
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      {label}
    </button>
  );
}
