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
  waTimestamp: Date;
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
