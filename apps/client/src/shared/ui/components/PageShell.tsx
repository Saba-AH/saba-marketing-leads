import React from 'react';

/** Contenedor de una pantalla (`.view` del prototipo: padding 28px 32px). */
export function PageShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className="px-8 py-7">{children}</div>;
}
