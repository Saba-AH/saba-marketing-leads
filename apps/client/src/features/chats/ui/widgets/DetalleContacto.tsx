'use client';

import { Button } from '@repo/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { X } from 'lucide-react';
import React from 'react';
import type { Conversacion } from '../../domain/chat.model';
import { useEsPantallaAncha } from '../hooks/useEsPantallaAncha';
import { PanelClienteSaba } from './PanelClienteSaba';

const TITULO = 'Info. del contacto';

/** Como en WhatsApp Web: al costado del hilo en pantallas anchas, deslizable en las demás. */
export function DetalleContacto({
  conversacion,
  abierto,
  onCerrar,
}: {
  conversacion: Conversacion;
  abierto: boolean;
  onCerrar: () => void;
}): React.JSX.Element | null {
  const ancha = useEsPantallaAncha();

  if (!ancha) {
    return (
      <Sheet open={abierto} onOpenChange={(open) => !open && onCerrar()}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{TITULO}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <PanelClienteSaba conversacion={conversacion} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!abierto) return null;
  return (
    <aside
      aria-label={TITULO}
      className="flex w-80 shrink-0 flex-col overflow-y-auto border-l"
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar el detalle"
          onClick={onCerrar}
        >
          <X aria-hidden="true" />
        </Button>
        <h2 className="font-semibold">{TITULO}</h2>
      </header>
      <div className="p-4">
        <PanelClienteSaba conversacion={conversacion} />
      </div>
    </aside>
  );
}
