import React from 'react';

/** Container for a screen (the prototype's `.view`: padding 28px 32px). */
export function PageShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className="px-8 py-7">{children}</div>;
}
