import type {
  TClienteSabaChatResponse,
  TConversacionesResponse,
  TConversacionResumen,
  TMensajeChat,
  TMensajeResponse,
  TMensajesResponse,
} from '@repo/schemas';
import type { ClienteSabaDelChat } from '../../application/ports/in/ObtenerClienteSabaPort';
import {
  type ConversacionResumen,
  type MensajeChat,
  ventanaExpiraAt,
} from '../../domain/Chats';

function toConversacion(c: ConversacionResumen): TConversacionResumen {
  return {
    id: c.id,
    contacto: {
      id: c.contacto.id,
      telefono: c.contacto.waId,
      nombreWhatsApp: c.contacto.profileName,
      vinculadoASaba: c.contacto.sabaProfileId !== null,
    },
    estado: c.estado,
    noLeidos: c.noLeidos,
    ultimoMensajeAt: c.ultimoMensajeAt?.toISOString() ?? null,
    ultimoMensajePreview: c.ultimoMensajePreview,
    ventanaExpiraAt: ventanaExpiraAt(c.ultimoEntranteAt)?.toISOString() ?? null,
  };
}

function toMensaje(m: MensajeChat): TMensajeChat {
  return {
    id: m.id,
    direccion: m.direccion,
    origen: m.origen,
    tipo: m.tipo,
    cuerpo: m.cuerpo,
    estado: m.estado,
    errorDetalle: m.errorDetalle,
    tieneMedia: m.tieneMedia,
    waTimestamp: m.waTimestamp.toISOString(),
  };
}

export function toConversacionesResponse(
  conversaciones: ConversacionResumen[]
): TConversacionesResponse {
  return { success: true, data: conversaciones.map(toConversacion) };
}

export function toMensajesResponse(mensajes: MensajeChat[]): TMensajesResponse {
  return { success: true, data: mensajes.map(toMensaje) };
}

export function toMensajeResponse(mensaje: MensajeChat): TMensajeResponse {
  return { success: true, data: toMensaje(mensaje) };
}

export function toClienteSabaChatResponse(
  resultado: ClienteSabaDelChat
): TClienteSabaChatResponse {
  return { success: true, data: resultado };
}
