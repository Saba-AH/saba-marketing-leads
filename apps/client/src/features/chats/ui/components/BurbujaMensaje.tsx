import { cn } from '@repo/ui/lib/utils';
import { Check, CheckCheck, CircleAlert, Clock } from 'lucide-react';
import React from 'react';
import {
  avisoSinTexto,
  type EstadoMensaje,
  formaMedia,
  formatearHora,
  type Mensaje,
} from '../../domain/chat.model';
import { AdjuntoMensaje } from './AdjuntoMensaje';

const ESTADOS: Record<
  EstadoMensaje,
  { etiqueta: string; Icono: typeof Check }
> = {
  pendiente: { etiqueta: 'Enviando', Icono: Clock },
  enviado: { etiqueta: 'Enviado', Icono: Check },
  entregado: { etiqueta: 'Entregado', Icono: CheckCheck },
  leido: { etiqueta: 'Leído', Icono: CheckCheck },
  fallido: { etiqueta: 'No se envió', Icono: CircleAlert },
};

const ORIGENES: Partial<Record<Mensaje['origen'], string>> = {
  celular: 'Desde el celular',
  historial: 'Historial',
};

export function BurbujaMensaje({
  mensaje,
}: {
  mensaje: Mensaje;
}): React.JSX.Element {
  const saliente = mensaje.direccion === 'saliente';
  const forma = formaMedia(mensaje);
  const aviso = forma ? null : avisoSinTexto(mensaje.tipo);
  const estado = mensaje.estado ? ESTADOS[mensaje.estado] : null;
  const origen = ORIGENES[mensaje.origen];

  return (
    <li className={cn('flex', saliente ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-xs md:max-w-[75%]',
          saliente
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {origen && <p className="mb-1 text-xs opacity-70">{origen}</p>}
        {forma && mensaje.mediaUrl && (
          <AdjuntoMensaje
            mensaje={mensaje}
            forma={forma}
            url={mensaje.mediaUrl}
          />
        )}
        {aviso && <p className="italic opacity-80">{aviso}</p>}
        {mensaje.cuerpo && (
          <p className="whitespace-pre-wrap break-words">{mensaje.cuerpo}</p>
        )}
        <p className="mt-1 flex items-center justify-end gap-1 text-xs opacity-70">
          {formatearHora(mensaje.waTimestamp)}
          {estado && (
            <estado.Icono aria-label={estado.etiqueta} className="size-3.5" />
          )}
        </p>
        {mensaje.estado === 'fallido' && (
          <p role="alert" className="mt-1 font-medium text-xs">
            No se envió{mensaje.errorDetalle ? `: ${mensaje.errorDetalle}` : ''}
          </p>
        )}
      </div>
    </li>
  );
}
