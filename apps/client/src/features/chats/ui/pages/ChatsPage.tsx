'use client';

import { MessageSquare } from 'lucide-react';
import React from 'react';
import { useConversaciones } from '../../application/queries/useConversaciones.query';
import { HiloConversacion } from '../widgets/HiloConversacion';
import { ListaConversaciones } from '../widgets/ListaConversaciones';

/** Lista a la izquierda, hilo a la derecha. Ocupa el alto bajo la barra superior (h-12). */
export function ChatsPage(): React.JSX.Element {
  const [seleccionadaId, setSeleccionadaId] = React.useState<string | null>(
    null
  );
  const { data: conversaciones } = useConversaciones();
  const seleccionada =
    conversaciones?.find((c) => c.id === seleccionadaId) ?? null;

  return (
    <div className="grid h-[calc(100svh-3rem)] grid-cols-[minmax(16rem,22rem)_1fr]">
      <aside className="flex min-h-0 flex-col border-r">
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
        <HiloConversacion key={seleccionada.id} conversacion={seleccionada} />
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
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
