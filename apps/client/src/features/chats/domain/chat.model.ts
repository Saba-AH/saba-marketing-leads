export type EstadoMensaje =
  | 'pendiente'
  | 'enviado'
  | 'entregado'
  | 'leido'
  | 'fallido';

export interface Conversacion {
  id: string;
  contacto: {
    id: string;
    telefono: string | null;
    nombreWhatsApp: string | null;
    vinculadoASaba: boolean;
  };
  estado: 'abierta' | 'resuelta';
  noLeidos: number;
  ultimoMensajeAt: Date | null;
  ultimoMensajePreview: string | null;
  ventanaExpiraAt: Date | null;
}

export interface Mensaje {
  id: string;
  direccion: 'entrante' | 'saliente';
  origen: 'cliente' | 'sistema' | 'celular' | 'historial';
  tipo: string;
  cuerpo: string | null;
  estado: EstadoMensaje | null;
  errorDetalle: string | null;
  /** Dónde pedir el archivo (imagen, audio…); `null` si no tiene. */
  mediaUrl: string | null;
  waTimestamp: Date;
}

const ZONA = 'America/Caracas';

/** `584141234567` → `+58 414 123 4567`; otros países, `+` y los dígitos. */
export function formatearTelefono(digitos: string): string {
  const ve = /^58(\d{3})(\d{3})(\d{4})$/.exec(digitos);
  return ve ? `+58 ${ve[1]} ${ve[2]} ${ve[3]}` : `+${digitos}`;
}

export function nombreVisible(conversacion: Conversacion): string {
  const { nombreWhatsApp, telefono } = conversacion.contacto;
  return (
    nombreWhatsApp ??
    (telefono ? formatearTelefono(telefono) : 'Contacto de WhatsApp')
  );
}

export interface EstadoVentana {
  abierta: boolean;
  /** "5 h 12 min"; vacío si está cerrada. */
  restante: string;
}

export function estadoVentana(
  ventanaExpiraAt: Date | null,
  ahora: Date
): EstadoVentana {
  const ms = ventanaExpiraAt ? ventanaExpiraAt.getTime() - ahora.getTime() : 0;
  if (ms <= 0) return { abierta: false, restante: '' };
  const minutos = Math.ceil(ms / 60_000);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return {
    abierta: true,
    restante: horas > 0 ? `${horas} h ${resto} min` : `${resto} min`,
  };
}

function mismaFecha(a: Date, b: Date): boolean {
  const dia = (d: Date) => d.toLocaleDateString('es-VE', { timeZone: ZONA });
  return dia(a) === dia(b);
}

export function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString('es-VE', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Hora si fue hoy; si no, día y mes. Para la lista de conversaciones. */
export function formatearMomento(fecha: Date, ahora: Date): string {
  return mismaFecha(fecha, ahora)
    ? formatearHora(fecha)
    : fecha.toLocaleDateString('es-VE', {
        timeZone: ZONA,
        day: '2-digit',
        month: '2-digit',
      });
}

const AVISOS_SIN_TEXTO: Record<string, string> = {
  image: '📷 Imagen',
  video: '🎥 Video',
  audio: '🎤 Audio',
  document: '📄 Documento',
  sticker: 'Sticker',
  location: '📍 Ubicación',
  contacts: '👤 Contacto',
};

export type FormaMedia = 'imagen' | 'audio' | 'video' | 'documento';

const FORMAS: Record<string, FormaMedia> = {
  image: 'imagen',
  sticker: 'imagen',
  audio: 'audio',
  video: 'video',
  document: 'documento',
};

/** Cómo mostrar el archivo de un mensaje; `null` si no tiene o no se sabe mostrar. */
export function formaMedia(mensaje: Mensaje): FormaMedia | null {
  return mensaje.mediaUrl ? (FORMAS[mensaje.tipo] ?? null) : null;
}

/**
 * Lo que se muestra de un mensaje que no es texto y no se puede ver en el
 * panel (ubicación, contacto, o un archivo que Meta ya no conserva).
 */
export function avisoSinTexto(tipo: string): string | null {
  const etiqueta = AVISOS_SIN_TEXTO[tipo];
  if (tipo === 'text' || tipo === 'template') return null;
  return `${etiqueta ?? 'Mensaje no compatible'} — ver en el celular`;
}

/** "Ana María Pérez" → "AP"; `null` si no hay letras (p. ej. solo un teléfono). */
export function iniciales(nombre: string): string | null {
  const palabras = nombre.match(/\p{L}+/gu) ?? [];
  const [primera, ...resto] = palabras;
  if (!primera) return null;
  const ultima = resto.at(-1);
  return `${primera[0]}${ultima?.[0] ?? ''}`.toUpperCase();
}
