import { cn } from '@repo/ui/lib/utils';
import { UserRound } from 'lucide-react';
import React from 'react';
import { initials } from '../../domain/chat.model';

const SIZES = {
  sm: 'size-10 text-sm',
  lg: 'size-20 text-2xl',
} as const;

/** Circle with the initials, like in WhatsApp; without letters (phone only), an icon. */
export function InitialsAvatar({
  name,
  size = 'sm',
}: {
  name: string;
  size?: keyof typeof SIZES;
}): React.JSX.Element {
  const letters = initials(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground',
        SIZES[size]
      )}
    >
      {letters ?? <UserRound className="size-1/2" />}
    </span>
  );
}
