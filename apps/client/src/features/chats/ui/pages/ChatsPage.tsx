'use client';

import { cn } from '@repo/ui/lib/utils';
import { MessageSquare } from 'lucide-react';
import React from 'react';
import { useConversaciones } from '../../application/queries/useConversaciones.query';
import { HiloConversacion } from '../widgets/HiloConversacion';
import { ListaConversaciones } from '../widgets/ListaConversaciones';

/**
 * Desde `md`: lista a la izquierda e hilo a la derecha. Más angosto: una cosa a
 * la vez, como WhatsApp (la lista, o el hilo con su botón de volver). Ocupa el
 * alto bajo la barra superior (h-12).
 */
export function ChatsPage(): React.JSX.Element {
  const [seleccionadaId, setSeleccionadaId] = React.useState<string | null>(
    null
  );
  const { data: conversaciones } = useConversaciones();
  console.log("🚀 ~ ChatsPage ~ conversaciones:", conversaciones)
  const seleccionada =
    conversaciones?.find((c) => c.id === seleccionadaId) ?? null;

  return (
    <div className="grid h-[calc(100svh-3rem)] grid-cols-1 md:grid-cols-[minmax(16rem,22rem)_1fr]">
      <aside
        className={cn(
          'min-h-0 flex-col md:flex md:border-r',
          seleccionada ? 'hidden' : 'flex'
        )}
      >
        <header className="border-b px-4 py-3">
          <h1 className="font-bold text-lg">Chats</h1>
          <p className="text-muted-foreground text-xs">
            Conversaciones de WhatsApp con los clientes de Saba.
          </p>
        </header>
        <ListaConversaciones
          seleccionadaId={seleccionadaId}
          onSeleccionar={setSeleccionadaId}
        />
      </aside>
      {seleccionada ? (
        <HiloConversacion
          key={seleccionada.id}
          conversacion={seleccionada}
          onVolver={() => setSeleccionadaId(null)}
        />
      ) : (
        <div className="hidden flex-col items-center justify-center text-center text-muted-foreground md:flex">
          <MessageSquare
            aria-hidden="true"
            className="mb-3 size-10 opacity-40"
          />
          <p className="text-sm">
            Elige una conversación para ver los mensajes.
          </p>
        </div>
      )}
    </div>
  );
}
