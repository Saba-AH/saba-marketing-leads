import { cn } from '@repo/ui/lib/utils';
import { Link2 } from 'lucide-react';
import React from 'react';
import {
  type Conversacion,
  formatearMomento,
  nombreVisible,
} from '../../domain/chat.model';

export function ConversacionItem({
  conversacion,
  seleccionada,
  ahora,
  onSeleccionar,
}: {
  conversacion: Conversacion;
  seleccionada: boolean;
  ahora: Date;
  onSeleccionar: (id: string) => void;
}): React.JSX.Element {
  const nombre = nombreVisible(conversacion);
  return (
    <button
      type="button"
      aria-current={seleccionada ? 'true' : undefined}
      onClick={() => onSeleccionar(conversacion.id)}
      className={cn(
        'flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-accent',
        seleccionada && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold text-sm">
          {nombre}
        </span>
        {conversacion.contacto.vinculadoASaba && (
          <Link2
            aria-label="Vinculado a Saba"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        )}
        {conversacion.ultimoMensajeAt && (
          <span className="shrink-0 text-muted-foreground text-xs">
            {formatearMomento(conversacion.ultimoMensajeAt, ahora)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-muted-foreground text-sm">
          {conversacion.ultimoMensajePreview ?? 'Sin mensajes'}
        </span>
        {conversacion.noLeidos > 0 && (
          <span
            aria-label={`${conversacion.noLeidos} sin leer`}
            className="shrink-0 rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground text-xs"
          >
            {conversacion.noLeidos}
          </span>
        )}
      </div>
    </button>
  );
}
