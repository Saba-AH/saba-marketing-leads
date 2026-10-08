import { cn } from '@repo/ui/lib/utils';
import React from 'react';

interface ComingSoonProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a whole option/section to show it disabled with a "Próximamente"
 * badge. `inert` takes the children out of the tab order and blocks
 * mouse/keyboard at the platform level; the `onClickCapture` is a second layer
 * that does not depend on jsdom (tests) implementing that behavior.
 */
export function ComingSoon({ children, className }: ComingSoonProps) {
  return (
    <div
      aria-disabled="true"
      inert
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      className={cn('relative inline-block cursor-not-allowed', className)}
    >
      <div className="pointer-events-none opacity-50">{children}</div>
      <span className="-top-2 -right-2 absolute rounded-full bg-utility-brand-100 px-2 py-0.5 text-[10px] font-semibold txt-brand-secondary-700">
        Próximamente
      </span>
    </div>
  );
}
