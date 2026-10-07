import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/** Límite de Meta para el cuerpo de un mensaje de texto. */
export const LARGO_MAXIMO_MENSAJE = 4096;

export const estadosConversacion = ['abierta', 'resuelta'] as const;
export const estadosMensaje = [
  'pendiente',
  'enviado',
  'entregado',
  'leido',
  'fallido',
] as const;

export const conversacionResumenSchema = z.object({
  id: z.string(),
  contacto: z.object({
    id: z.string(),
    /** Teléfono en dígitos; `null` si el cliente solo comparte su nombre de usuario. */
    telefono: z.string().nullable(),
    nombreWhatsApp: z.string().nullable(),
    vinculadoASaba: z.boolean(),
  }),
  estado: z.enum(estadosConversacion),
  noLeidos: z.number().int(),
  ultimoMensajeAt: z.string().nullable(),
  ultimoMensajePreview: z.string().nullable(),
  /** Hasta cuándo se puede responder con texto libre; `null` si el cliente nunca escribió. */
  ventanaExpiraAt: z.string().nullable(),
});
export type TConversacionResumen = z.infer<typeof conversacionResumenSchema>;

export const conversacionesResponseSchema = buildSafeResponseSchema(
  z.array(conversacionResumenSchema)
);
export type TConversacionesResponse = z.infer<
  typeof conversacionesResponseSchema
>;

export const mensajeChatSchema = z.object({
  id: z.string(),
  direccion: z.enum(['entrante', 'saliente']),
  origen: z.enum(['cliente', 'sistema', 'celular', 'historial']),
  tipo: z.string(),
  cuerpo: z.string().nullable(),
  estado: z.enum(estadosMensaje).nullable(),
  errorDetalle: z.string().nullable(),
  waTimestamp: z.string(),
});
export type TMensajeChat = z.infer<typeof mensajeChatSchema>;

export const mensajesResponseSchema = buildSafeResponseSchema(
  z.array(mensajeChatSchema)
);
export type TMensajesResponse = z.infer<typeof mensajesResponseSchema>;

export const mensajeResponseSchema = buildSafeResponseSchema(mensajeChatSchema);
export type TMensajeResponse = z.infer<typeof mensajeResponseSchema>;

/** Body de `POST /whatsapp/conversaciones/:id/mensajes`. */
export const enviarMensajeSchema = z.object({
  cuerpo: z
    .string()
    .trim()
    .min(1, 'Escribe un mensaje.')
    .max(
      LARGO_MAXIMO_MENSAJE,
      `El mensaje no puede pasar de ${LARGO_MAXIMO_MENSAJE} caracteres.`
    ),
});
export type TEnviarMensaje = z.infer<typeof enviarMensajeSchema>;
