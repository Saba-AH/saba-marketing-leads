import type { TConversacionResumen, TMensajeChat } from '@repo/schemas';
import type { Conversacion, Mensaje } from '../domain/chat.model';

function fecha(iso: string | null): Date | null {
  return iso ? new Date(iso) : null;
}

export function toConversacionDomain(dto: TConversacionResumen): Conversacion {
  return {
    id: dto.id,
    contacto: { ...dto.contacto },
    estado: dto.estado,
    noLeidos: dto.noLeidos,
    ultimoMensajeAt: fecha(dto.ultimoMensajeAt),
    ultimoMensajePreview: dto.ultimoMensajePreview,
    ventanaExpiraAt: fecha(dto.ventanaExpiraAt),
  };
}

export function toMensajeDomain(dto: TMensajeChat): Mensaje {
  return {
    id: dto.id,
    direccion: dto.direccion,
    origen: dto.origen,
    tipo: dto.tipo,
    cuerpo: dto.cuerpo,
    estado: dto.estado,
    errorDetalle: dto.errorDetalle,
    waTimestamp: new Date(dto.waTimestamp),
  };
}
