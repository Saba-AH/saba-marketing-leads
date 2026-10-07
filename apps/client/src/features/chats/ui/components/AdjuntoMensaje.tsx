'use client';

import { FileDown } from 'lucide-react';
import React from 'react';
import {
  avisoSinTexto,
  type FormaMedia,
  type Mensaje,
} from '../../domain/chat.model';

/**
 * El archivo se pide recién al mostrarse (`loading="lazy"`, `preload="none"`).
 * Si Meta ya no lo tiene (~30 días), vuelve al aviso de "ver en el celular".
 */
export function AdjuntoMensaje({
  mensaje,
  forma,
  url,
}: {
  mensaje: Mensaje;
  forma: FormaMedia;
  url: string;
}): React.JSX.Element {
  const [noDisponible, setNoDisponible] = React.useState(false);
  const marcarNoDisponible = (): void => setNoDisponible(true);

  if (noDisponible) {
    return (
      <p className="italic opacity-80">
        {avisoSinTexto(mensaje.tipo)} (ya no está en WhatsApp)
      </p>
    );
  }

  switch (forma) {
    case 'imagen':
      return (
        <a href={url} target="_blank" rel="noopener" className="block">
          <img
            src={url}
            alt={mensaje.tipo === 'sticker' ? 'Sticker' : 'Imagen del cliente'}
            loading="lazy"
            onError={marcarNoDisponible}
            className={
              mensaje.tipo === 'sticker'
                ? 'size-32 object-contain'
                : 'max-h-72 w-auto max-w-full rounded-md object-contain'
            }
          />
        </a>
      );
    case 'audio':
      return (
        <audio
          controls
          preload="none"
          src={url}
          onError={marcarNoDisponible}
          className="w-64 max-w-full"
        />
      );
    case 'video':
      return (
        <video
          controls
          preload="none"
          src={url}
          onError={marcarNoDisponible}
          className="max-h-72 max-w-full rounded-md"
        />
      );
    case 'documento':
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 underline underline-offset-2"
        >
          <FileDown aria-hidden="true" className="size-4" />
          Abrir documento
        </a>
      );
  }
}
