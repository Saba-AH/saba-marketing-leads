import React from 'react';

/** Helper text below a field (`.field .hint` in the prototype). */
export function FieldHint({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <p className="mt-1 text-[11px] text-gray-500">{children}</p>;
}
