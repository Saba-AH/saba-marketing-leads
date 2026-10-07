export type EstadoMensaje =
  | 'pendiente'
  | 'enviado'
  | 'entregado'
  | 'leido'
  | 'fallido';

/** Al menos uno de los dos viene siempre; con nombre de usuario puede faltar el teléfono. */
export interface IdentidadContacto {
  waId: string | null;
  userId: string | null;
}

export interface MensajeEntrante {
  wamid: string;
  identidad: IdentidadContacto;
  profileName: string | null;
  tipo: string;
  cuerpo: string | null;
  mediaId: string | null;
  waTimestamp: Date;
  /** Lo que se ve en la lista de conversaciones. */
  preview: string;
  /** Si abre (o renueva) la ventana de 24 h para responder con texto libre. */
  abreVentana: boolean;
}

export interface CambioEstadoMensaje {
  wamid: string;
  estado: EstadoMensaje;
  errorCodigo: string | null;
  errorDetalle: string | null;
}

export type AccionInbox =
  | { tipo: 'mensajeEntrante'; mensaje: MensajeEntrante }
  | { tipo: 'estadoMensaje'; cambio: CambioEstadoMensaje };

/**
 * Estados desde los que un mensaje puede pasar a `nuevo`. Meta no garantiza el
 * orden de los avisos: un "entregado" que llega después de "leído" no retrocede.
 */
export function estadosQueAvanzanA(nuevo: EstadoMensaje): EstadoMensaje[] {
  switch (nuevo) {
    case 'pendiente':
      return [];
    case 'enviado':
      return ['pendiente'];
    case 'entregado':
      return ['pendiente', 'enviado'];
    case 'leido':
      return ['pendiente', 'enviado', 'entregado'];
    case 'fallido':
      return ['pendiente', 'enviado'];
  }
}
