'use client';

import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ArrowLeft, Clock, Lock } from 'lucide-react';
import React from 'react';
import { ErrorState } from '@/shared/ui/components/ErrorState';
import { useEnviarMensaje } from '../../application/mutations/useEnviarMensaje.mutation';
import { useMarcarLeida } from '../../application/mutations/useMarcarLeida.mutation';
import { useMensajes } from '../../application/queries/useMensajes.query';
import {
  type Conversacion,
  estadoVentana,
  formatearTelefono,
  nombreVisible,
} from '../../domain/chat.model';
import { BurbujaMensaje } from '../components/BurbujaMensaje';
import { ComposerMensaje } from '../components/ComposerMensaje';

export function HiloConversacion({
  conversacion,
  onVolver,
}: {
  conversacion: Conversacion;
  /** En pantallas angostas el hilo tapa la lista: esto vuelve a ella. */
  onVolver: () => void;
}): React.JSX.Element {
  const { data: mensajes, isPending, error } = useMensajes(conversacion.id);
  const enviar = useEnviarMensaje(conversacion.id);
  const marcarLeida = useMarcarLeida();
  const finRef = React.useRef<HTMLDivElement>(null);
  const ventana = estadoVentana(conversacion.ventanaExpiraAt, new Date());
  const { telefono } = conversacion.contacto;

  // Abrir el chat (o recibir algo mientras está abierto) lo deja leído.
  const { mutate: marcar } = marcarLeida;
  React.useEffect(() => {
    if (conversacion.noLeidos > 0) marcar(conversacion.id);
  }, [conversacion.id, conversacion.noLeidos, marcar]);

  const cantidad = mensajes?.length ?? 0;
  React.useEffect(() => {
    if (cantidad > 0) finRef.current?.scrollIntoView?.({ block: 'end' });
  }, [cantidad]);

  return (
    <section
      aria-label={`Chat con ${nombreVisible(conversacion)}`}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex items-center gap-2 border-b px-3 py-3 md:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-label="Volver a los chats"
          onClick={onVolver}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">
            {nombreVisible(conversacion)}
          </h2>
          <p className="truncate text-muted-foreground text-xs">
            {telefono ? formatearTelefono(telefono) : 'Sin teléfono'}
            {conversacion.contacto.vinculadoASaba
              ? ' · Vinculado a Saba'
              : ' · Sin vincular a Saba'}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="ml-auto h-10 w-1/2" />
          </div>
        )}
        {error && <ErrorState error={error} />}
        {mensajes && (
          <ol aria-label="Mensajes" className="flex flex-col gap-2">
            {mensajes.map((mensaje) => (
              <BurbujaMensaje key={mensaje.id} mensaje={mensaje} />
            ))}
          </ol>
        )}
        <div ref={finRef} />
      </div>

      <footer className="border-t px-3 py-3 md:px-5">
        {ventana.abierta && telefono ? (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock aria-hidden="true" className="size-3.5" />
              Ventana de respuesta: quedan {ventana.restante}
            </p>
            <ComposerMensaje
              onEnviar={async (datos) => {
                try {
                  await enviar.mutateAsync(datos);
                  return true;
                } catch {
                  // El mensaje del error se muestra abajo (`enviar.error`).
                  return false;
                }
              }}
            />
            {enviar.isError && (
              <p role="alert" className="text-destructive text-sm">
                {enviar.error.message}
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-muted-foreground text-sm">
            <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {telefono
              ? 'Pasaron más de 24 h desde el último mensaje del cliente. Solo se le puede escribir con una plantilla (próximamente).'
              : 'Este contacto solo comparte su nombre de usuario de WhatsApp: todavía no se le puede responder desde el panel.'}
          </p>
        )}
      </footer>
    </section>
  );
}
