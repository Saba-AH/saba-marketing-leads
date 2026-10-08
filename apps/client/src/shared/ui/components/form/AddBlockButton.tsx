'use client';

import React from 'react';

/**
 * Add button for a repeatable block (the prototype's `.add-grant-btn`): full
 * width, dashed border, and purple on hover. Used by "+ Agregar país" and it
 * will be used by the grant rows of #57/#58.
 */
export function AddBlockButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      className="w-full cursor-pointer rounded-md border-[1.5px] border-gray-300 border-dashed py-2.5 font-bold text-[12.5px] text-gray-600 transition-colors hover:border-brand-600 hover:bg-brand-50 hover:text-brand-600"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
