'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import React from 'react';
import { formatearHora, type ImagenChat } from '../../domain/chat.model';

/**
 * Visor a pantalla completa, como el de WhatsApp: flechas (y ← → del teclado)
 * para recorrer las fotos del chat; Esc, la X o tocar afuera lo cierran.
 */
export function VisorImagenes({
  imagenes,
  indice,
  onCambiar,
  onCerrar,
}: {
  imagenes: ImagenChat[];
  /** `null`: cerrado. */
  indice: number | null;
  onCambiar: (indice: number) => void;
  onCerrar: () => void;
}): React.JSX.Element {
  const actual = indice === null ? null : (imagenes[indice] ?? null);
  const hayAnterior = indice !== null && indice > 0;
  const haySiguiente = indice !== null && indice < imagenes.length - 1;

  function irA(delta: number): void {
    if (indice === null) return;
    const destino = indice + delta;
    if (destino >= 0 && destino < imagenes.length) onCambiar(destino);
  }

  return (
    <Dialog open={actual !== null} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowLeft') irA(-1);
          if (evento.key === 'ArrowRight') irA(1);
        }}
        className="top-0 left-0 flex h-svh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-foreground/95 p-0 text-background sm:max-w-none"
      >
        {actual && indice !== null && (
          <>
            <header className="flex items-center gap-3 px-4 py-3 pr-14 text-sm">
              <DialogTitle className="font-medium text-base">
                Imagen {indice + 1} de {imagenes.length}
              </DialogTitle>
              <DialogDescription className="text-background/70">
                {formatearHora(actual.waTimestamp)}
              </DialogDescription>
              <a
                href={actual.url}
                target="_blank"
                rel="noopener"
                className="ml-auto inline-flex items-center gap-1 text-background/80 underline-offset-2 hover:underline"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Abrir original
              </a>
            </header>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-4">
              <img
                key={actual.mensajeId}
                src={actual.url}
                alt={actual.descripcion ?? `Imagen ${indice + 1} del cliente`}
                className="max-h-full max-w-full rounded-md object-contain"
              />
              {hayAnterior && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Imagen anterior"
                  onClick={() => irA(-1)}
                  className="absolute left-3 size-10 rounded-full"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
              )}
              {haySiguiente && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Imagen siguiente"
                  onClick={() => irA(1)}
                  className="absolute right-3 size-10 rounded-full"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </div>

            {actual.descripcion && (
              <p className="px-4 pb-4 text-center text-sm">
                {actual.descripcion}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
