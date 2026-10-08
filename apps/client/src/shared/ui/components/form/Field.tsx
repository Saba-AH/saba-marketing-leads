import { cn } from '@repo/ui/lib/utils';
import React from 'react';

/**
 * The prototype's form field (`.field`): a 12.5px bold gray label, the
 * control, and optional helper text below.
 *
 * `htmlFor` is optional because some fields group several controls (a
 * `RadioRow`, a list of chips) and there is no single one to point to; in that
 * case the label renders as text and the group carries its own accessible
 * name.
 */
export function Field({
  label,
  htmlFor,
  help,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-col', className)}>
      {htmlFor ? (
        <label
          className="mb-1.5 block font-bold text-[12.5px] text-gray-700"
          htmlFor={htmlFor}
        >
          {label}
        </label>
      ) : (
        <span className="mb-1.5 block font-bold text-[12.5px] text-gray-700">
          {label}
        </span>
      )}
      {children}
      {help && <p className="mt-1 text-[11px] text-gray-500">{help}</p>}
    </div>
  );
}
