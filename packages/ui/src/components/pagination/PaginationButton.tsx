import { buttonVariants } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

type PaginationButtonProps = {
  active?: boolean;
} & React.ComponentProps<'button'>;

/**
 * Replaces shadcn's `PaginationLink`, which renders an `<a>`.
 *
 * That component assumes URL-based pagination. Here the page is in-memory
 * state: there is no destination to point to, so an anchor would be a fake
 * link — the screen reader would announce it as a link, the space bar would not
 * activate it and opening it in another tab would lead nowhere.
 */
export default function PaginationButton({
  className,
  active,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: active ? 'outline' : 'ghost', size: 'icon' }),
        className
      )}
      data-active={active}
      data-slot="pagination-button"
      type="button"
      {...props}
    />
  );
}
