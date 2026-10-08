'use client';

import { cn } from '@repo/ui/lib/utils';
import { LoaderCircle } from 'lucide-react';
import React from 'react';

/**
 * Mientras baja de Meta muestra un recuadro con spinner del tamaño aproximado
 * de la imagen: reserva el lugar para que el hilo no salte al terminar.
 */
export function ImagenAdjunta({
  url,
  sticker,
  onError,
  onAbrir,
}: {
  url: string;
  sticker: boolean;
  onError: () => void;
  /** Abre el visor; sin esto (stickers) la imagen no es clickeable. */
  onAbrir?: () => void;
}): React.JSX.Element {
  const [cargando, setCargando] = React.useState(true);
  const Contenedor = onAbrir ? 'button' : 'div';
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Si ya estaba en caché, el navegador puede terminar antes de que React
  // enganche `onLoad`.
  React.useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setCargando(false);
    }
  }, []);

  return (
    <Contenedor
      {...(onAbrir
        ? {
            type: 'button' as const,
            onClick: onAbrir,
            'aria-label': 'Ver imagen en grande',
          }
        : {})}
      aria-busy={cargando}
      className={cn(
        'relative block',
        onAbrir && 'cursor-zoom-in',
        cargando && (sticker ? 'size-32' : 'h-56 w-56 max-w-full')
      )}
    >
      {cargando && (
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
        onLoad={() => setCargando(false)}
        onError={onError}
        className={cn(
          sticker
            ? 'size-32 object-contain'
            : 'max-h-72 w-auto max-w-full rounded-md object-contain',
          cargando && 'absolute inset-0 opacity-0'
        )}
      />
    </Contenedor>
  );
}
