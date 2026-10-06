import React from 'react';

/** Texto de apoyo bajo un campo (`.field .hint` del prototipo). */
export function CampoHint({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <p className="mt-1 text-[11px] text-gray-500">{children}</p>;
}
