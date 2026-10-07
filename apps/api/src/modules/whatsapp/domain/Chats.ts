import type { EstadoMensaje } from './Inbox';

const VENTANA_MS = 24 * 60 * 60 * 1000;

export interface ConversacionResumen {
  id: string;
  contacto: {
    id: string;
    waId: string | null;
    profileName: string | null;
    sabaProfileId: string | null;
  };
  estado: 'abierta' | 'resuelta';
  noLeidos: number;
  ultimoMensajeAt: Date | null;
  ultimoMensajePreview: string | null;
  ultimoEntranteAt: Date | null;
}

export interface MensajeChat {
  id: string;
  direccion: 'entrante' | 'saliente';
  origen: 'cliente' | 'sistema' | 'celular' | 'historial';
  tipo: string;
  cuerpo: string | null;
  estado: EstadoMensaje | null;
  errorDetalle: string | null;
  tieneMedia: boolean;
  waTimestamp: Date;
}

/** Un archivo que manda el cliente, tal como lo entrega Meta (en stream: un video pesa megas). */
export interface ArchivoMedia {
  mimeType: string;
  tamano: number | null;
  contenido: ReadableStream<Uint8Array>;
}

/**
 * Tipos que se pueden mostrar dentro del panel sin riesgo. Cualquier otro
 * (HTML, SVG…) se sirve como descarga: abierto en el mismo origen podría
 * ejecutar código.
 */
const MIME_EN_LINEA = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/amr',
  'video/mp4',
  'video/3gpp',
  'application/pdf',
]);

export function seMuestraEnLinea(mimeType: string): boolean {
  return MIME_EN_LINEA.has(mimeType.split(';')[0]?.trim().toLowerCase() ?? '');
}

/** La ventana de 24 h la abre el último mensaje del cliente, no el nuestro. */
export function ventanaExpiraAt(ultimoEntranteAt: Date | null): Date | null {
  return ultimoEntranteAt
    ? new Date(ultimoEntranteAt.getTime() + VENTANA_MS)
    : null;
}

export function ventanaAbierta(
  ultimoEntranteAt: Date | null,
  ahora: Date
): boolean {
  const expira = ventanaExpiraAt(ultimoEntranteAt);
  return expira !== null && expira.getTime() > ahora.getTime();
}

/** Error que devolvió Meta al enviar; el caso de uso lo traduce. */
export class ErrorEnvioMeta extends Error {
  constructor(
    readonly codigo: number | null,
    readonly detalle: string
  ) {
    super(`Meta rechazó el envío (${codigo ?? 'sin código'}): ${detalle}`);
  }
}
