import { UserRound } from 'lucide-react';
import React from 'react';

export function AvisoPanel({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-8 text-center text-muted-foreground text-sm">
      <UserRound aria-hidden="true" className="size-8 opacity-40" />
      {children}
    </div>
  );
}
