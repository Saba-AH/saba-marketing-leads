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
import { type ChatImage, formatTime } from '../../domain/chat.model';

/**
 * Full-screen viewer, like WhatsApp's: arrows (and the ← → keys) to browse the
 * chat's photos; Esc, the X or clicking outside close it.
 */
export function ImageViewer({
  images,
  index,
  onChange,
  onClose,
}: {
  images: ChatImage[];
  /** `null`: cerrado. */
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
}): React.JSX.Element {
  const actual = index === null ? null : (images[index] ?? null);
  const hasPrevious = index !== null && index > 0;
  const hasNext = index !== null && index < images.length - 1;

  function goTo(delta: number): void {
    if (index === null) return;
    const target = index + delta;
    if (target >= 0 && target < images.length) onChange(target);
  }

  return (
    <Dialog open={actual !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') goTo(-1);
          if (event.key === 'ArrowRight') goTo(1);
        }}
        className="top-0 left-0 flex h-svh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-foreground/95 p-0 text-background sm:max-w-none"
      >
        {actual && index !== null && (
          <>
            <header className="flex items-center gap-3 px-4 py-3 pr-14 text-sm">
              <DialogTitle className="font-medium text-base">
                Imagen {index + 1} de {images.length}
              </DialogTitle>
              <DialogDescription className="text-background/70">
                {formatTime(actual.waTimestamp)}
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
                key={actual.messageId}
                src={actual.url}
                alt={actual.description ?? `Imagen ${index + 1} del cliente`}
                className="max-h-full max-w-full rounded-md object-contain"
              />
              {hasPrevious && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Imagen anterior"
                  onClick={() => goTo(-1)}
                  className="absolute left-3 size-10 rounded-full"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
              )}
              {hasNext && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Imagen siguiente"
                  onClick={() => goTo(1)}
                  className="absolute right-3 size-10 rounded-full"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </div>

            {actual.description && (
              <p className="px-4 pb-4 text-center text-sm">
                {actual.description}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
