import type { LucideIcon } from 'lucide-react';
import React from 'react';

/** A card detail with its icon; not shown if Saba does not have it. */
export function CustomerDatum({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  /** Button on the side (e.g. copy). */
  action?: React.ReactNode;
}): React.JSX.Element | null {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="break-all text-sm">{value}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
      {action}
    </div>
  );
}
