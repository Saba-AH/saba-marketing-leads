'use client';

import { cn } from '@repo/ui/lib/utils';
import { LoaderCircle } from 'lucide-react';
import React from 'react';

/**
 * While it downloads from Meta it shows a box with a spinner roughly the size
 * of the image: it reserves the space so the thread does not jump when done.
 */
export function AttachedImage({
  url,
  sticker,
  onError,
  onOpen,
}: {
  url: string;
  sticker: boolean;
  onError: () => void;
  /** Opens the viewer; without it (stickers) the image is not clickable. */
  onOpen?: () => void;
}): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const Container = onOpen ? 'button' : 'div';
  const imgRef = React.useRef<HTMLImageElement>(null);

  // If it was already cached, the browser may finish before React hooks up
  // `onLoad`.
  React.useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoading(false);
    }
  }, []);

  return (
    <Container
      {...(onOpen
        ? {
            type: 'button' as const,
            onClick: onOpen,
            'aria-label': 'Ver imagen en grande',
          }
        : {})}
      aria-busy={loading}
      className={cn(
        'relative block',
        onOpen && 'cursor-zoom-in',
        loading && (sticker ? 'size-32' : 'h-56 w-56 max-w-full')
      )}
    >
      {loading && (
        <span
          role="status"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-muted-foreground/10 text-muted-foreground text-xs"
        >
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
          Cargando imagen…
        </span>
      )}
      <img
        ref={imgRef}
        src={url}
        alt={sticker ? 'Sticker' : 'Imagen del cliente'}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={onError}
        className={cn(
          sticker
            ? 'size-32 object-contain'
            : 'max-h-72 w-auto max-w-full rounded-md object-contain',
          loading && 'absolute inset-0 opacity-0'
        )}
      />
    </Container>
  );
}
