'use client';

import { Skeleton } from '@repo/ui/components/skeleton';
import React from 'react';
import { EmptyState } from '@/shared/ui/components/EmptyState';
import { ErrorState } from '@/shared/ui/components/ErrorState';
import { useConversaciones } from '../../application/queries/useConversaciones.query';
import { ConversacionItem } from '../components/ConversacionItem';

export function ListaConversaciones({
  seleccionadaId,
  onSeleccionar,
}: {
  seleccionadaId: string | null;
  onSeleccionar: (id: string) => void;
}): React.JSX.Element {
  const { data, isPending, error } = useConversaciones();
  const ahora = new Date();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} />;
  if (data.length === 0) {
    return (
      <EmptyState
        titulo="Todavía no hay chats"
        descripcion="Cuando un cliente le escriba al WhatsApp de Saba, su conversación aparece acá."
      />
    );
  }

  return (
    <nav aria-label="Conversaciones" className="overflow-y-auto">
      {data.map((conversacion) => (
        <ConversacionItem
          key={conversacion.id}
          conversacion={conversacion}
          seleccionada={conversacion.id === seleccionadaId}
          ahora={ahora}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </nav>
  );
}
