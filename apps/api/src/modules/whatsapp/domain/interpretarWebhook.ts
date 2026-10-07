import { z } from 'zod';
import { PayloadWebhookInvalidoException } from './exceptions/PayloadWebhookInvalidoException';
import type {
  AccionInbox,
  CambioEstadoMensaje,
  EstadoMensaje,
  MensajeEntrante,
} from './Inbox';

const LARGO_PREVIEW = 120;

const TIPOS_CON_MEDIA = new Set([
  'image',
  'video',
  'audio',
  'document',
  'sticker',
]);

// Una reacción o un mensaje que WhatsApp no sabe mostrar no garantiza que Meta
// abra la ventana: se trata como cerrada antes que arriesgar un 131047.
const TIPOS_SIN_VENTANA = new Set(['reaction', 'unsupported', 'system']);

const ETIQUETAS: Record<string, string> = {
  image: '📷 Imagen',
  video: '🎥 Video',
  audio: '🎤 Audio',
  document: '📄 Documento',
  sticker: 'Sticker',
  location: '📍 Ubicación',
  contacts: '👤 Contacto',
  reaction: 'Reacción',
};

const ESTADOS: Record<string, EstadoMensaje> = {
  sent: 'enviado',
  delivered: 'entregado',
  read: 'leido',
  failed: 'fallido',
};

const textoOpcional = z.string().min(1).optional();

const mensajeSchema = z.looseObject({
  id: z.string().min(1),
  from: textoOpcional,
  from_user_id: textoOpcional,
  timestamp: z.string().regex(/^\d+$/),
  type: z.string().min(1),
  text: z.looseObject({ body: z.string() }).optional(),
  interactive: z
    .looseObject({
      button_reply: z.looseObject({ title: z.string() }).optional(),
      list_reply: z.looseObject({ title: z.string() }).optional(),
    })
    .optional(),
  button: z.looseObject({ text: z.string() }).optional(),
  reaction: z.looseObject({ emoji: z.string().optional() }).optional(),
  location: z
    .looseObject({
      name: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

const mediaSchema = z.looseObject({
  id: z.string().optional(),
  caption: z.string().optional(),
});

const estadoSchema = z.looseObject({
  id: z.string().min(1),
  status: z.string().min(1),
  errors: z
    .array(
      z.looseObject({
        code: z.union([z.number(), z.string()]),
        title: z.string().optional(),
        message: z.string().optional(),
        error_data: z
          .looseObject({ details: z.string().optional() })
          .optional(),
      })
    )
    .optional(),
});

const valueMessagesSchema = z.looseObject({
  contacts: z
    .array(
      z.looseObject({
        wa_id: textoOpcional,
        user_id: textoOpcional,
        profile: z.looseObject({ name: z.string().optional() }).optional(),
      })
    )
    .optional(),
  messages: z.array(z.unknown()).optional(),
  statuses: z.array(z.unknown()).optional(),
});

type Mensaje = z.infer<typeof mensajeSchema>;
type Contacto = NonNullable<
  z.infer<typeof valueMessagesSchema>['contacts']
>[number];

function parsear<T extends z.ZodType>(
  schema: T,
  valor: unknown,
  que: string
): z.infer<T> {
  const parsed = schema.safeParse(valor);
  if (!parsed.success) {
    throw new PayloadWebhookInvalidoException(
      `${que}: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`
    );
  }
  return parsed.data;
}

function cuerpoDe(mensaje: Mensaje): string | null {
  switch (mensaje.type) {
    case 'text':
      return mensaje.text?.body ?? null;
    case 'interactive':
      return (
        mensaje.interactive?.button_reply?.title ??
        mensaje.interactive?.list_reply?.title ??
        null
      );
    case 'button':
      return mensaje.button?.text ?? null;
    case 'reaction':
      return mensaje.reaction?.emoji ?? null;
    case 'location':
      return mensaje.location?.name ?? mensaje.location?.address ?? null;
    default: {
      if (!TIPOS_CON_MEDIA.has(mensaje.type)) return null;
      const media = mediaSchema.safeParse(mensaje[mensaje.type]);
      return media.success ? (media.data.caption ?? null) : null;
    }
  }
}

function mediaIdDe(mensaje: Mensaje): string | null {
  if (!TIPOS_CON_MEDIA.has(mensaje.type)) return null;
  const media = mediaSchema.safeParse(mensaje[mensaje.type]);
  return media.success ? (media.data.id ?? null) : null;
}

function previewDe(tipo: string, cuerpo: string | null): string {
  const texto = cuerpo?.trim() || ETIQUETAS[tipo] || 'Mensaje';
  return texto.length > LARGO_PREVIEW
    ? `${texto.slice(0, LARGO_PREVIEW - 1)}…`
    : texto;
}

function aMensajeEntrante(
  valor: unknown,
  contactos: Contacto[]
): MensajeEntrante {
  const mensaje = parsear(mensajeSchema, valor, 'messages[]');
  const waId = mensaje.from ?? null;
  const userId = mensaje.from_user_id ?? null;
  if (!waId && !userId) {
    throw new PayloadWebhookInvalidoException(
      `messages[] ${mensaje.id}: sin from ni from_user_id`
    );
  }
  const contacto = contactos.find(
    (c) =>
      (waId !== null && c.wa_id === waId) ||
      (userId !== null && c.user_id === userId)
  );
  const cuerpo = cuerpoDe(mensaje);
  return {
    wamid: mensaje.id,
    identidad: {
      waId: waId ?? contacto?.wa_id ?? null,
      userId: userId ?? contacto?.user_id ?? null,
    },
    profileName: contacto?.profile?.name ?? null,
    tipo: mensaje.type,
    cuerpo,
    mediaId: mediaIdDe(mensaje),
    waTimestamp: new Date(Number(mensaje.timestamp) * 1000),
    preview: previewDe(mensaje.type, cuerpo),
    abreVentana: !TIPOS_SIN_VENTANA.has(mensaje.type),
  };
}

function aCambioEstado(valor: unknown): CambioEstadoMensaje | null {
  const estado = parsear(estadoSchema, valor, 'statuses[]');
  const nuevo = ESTADOS[estado.status];
  // `deleted`, `warning` y otros que Meta agregue no cambian el estado del envío.
  if (!nuevo) return null;
  const error = estado.errors?.[0];
  return {
    wamid: estado.id,
    estado: nuevo,
    errorCodigo: error ? String(error.code) : null,
    errorDetalle:
      error?.error_data?.details ?? error?.message ?? error?.title ?? null,
  };
}

/**
 * Traduce un cambio del webhook a acciones sobre los chats. Los campos que la
 * fase 1 no procesa (cuenta, calidad, plantillas, coexistencia) devuelven `[]`:
 * el evento queda guardado y marcado como procesado.
 */
export function interpretarWebhook(
  campo: string,
  payload: unknown
): AccionInbox[] {
  if (campo !== 'messages') return [];

  const value = parsear(valueMessagesSchema, payload, 'messages');
  const contactos = value.contacts ?? [];

  const entrantes: AccionInbox[] = (value.messages ?? []).map((m) => ({
    tipo: 'mensajeEntrante',
    mensaje: aMensajeEntrante(m, contactos),
  }));

  const estados: AccionInbox[] = (value.statuses ?? []).flatMap((s) => {
    const cambio = aCambioEstado(s);
    return cambio ? [{ tipo: 'estadoMensaje' as const, cambio }] : [];
  });

  return [...entrantes, ...estados];
}
