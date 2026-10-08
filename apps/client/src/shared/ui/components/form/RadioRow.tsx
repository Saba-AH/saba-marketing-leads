'use client';

import React from 'react';

/** Row of mutually exclusive options (the prototype's `.radio-row`). */
export function RadioRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div aria-label={label} className="flex gap-2" role="radiogroup">
      {children}
    </div>
  );
}
