'use client';

import { cn } from '@repo/ui/lib/utils';
import { TriangleAlert, X } from 'lucide-react';
import React from 'react';

const VARIANTS = {
  error: 'border-error-200 bg-error-100 text-error-600',
  /** Something that is not the user's fault (a lockout, waiting): yellow. */
  warning: 'border-warning-200 bg-warning-50 text-warning-700',
} as const;

/**
 * Inline error banner (the prototype's `.alert-banner`). It replaces shadcn's
 * `Alert` in modals: the repo forbids native `alert()` and this is the
 * component the mockup uses for validations.
 */
export function AlertBanner({
  message,
  variant = 'error',
  onClose,
}: {
  message: string;
  variant?: keyof typeof VARIANTS;
  onClose?: () => void;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'mb-2 flex items-start gap-2.5 rounded-md border px-3.5 py-3 font-semibold text-[12.5px]',
        VARIANTS[variant]
      )}
      role="alert"
    >
      <TriangleAlert className="mt-px size-[17px] shrink-0" />
      <div>{message}</div>
      {onClose && (
        <button
          aria-label="Cerrar aviso"
          className="ml-auto shrink-0 cursor-pointer opacity-60 hover:opacity-100"
          onClick={onClose}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
