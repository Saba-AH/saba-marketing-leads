import type {
  TClienteSabaChat,
  TConversacionResumen,
  TMensajeChat,
} from '@repo/schemas';
import type { Conversacion, Mensaje } from '../domain/chat.model';
import type { ClienteSabaDelChat } from '../domain/clienteSaba.model';

/** El navegador lo pide al BFF, que agrega la sesión; nunca a Meta directo. */
function urlMedia(mensajeId: string): string {
  return `/api/backend/v1/whatsapp/mensajes/${encodeURIComponent(mensajeId)}/media`;
}

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
    mediaUrl: dto.tieneMedia ? urlMedia(dto.id) : null,
    waTimestamp: new Date(dto.waTimestamp),
  };
}

export function toClienteSabaDomain(dto: TClienteSabaChat): ClienteSabaDelChat {
  return {
    sinTelefono: dto.sinTelefono,
    clientes: dto.clientes.map((c) => ({
      ...c,
      clienteDesde: fecha(c.clienteDesde),
      solicitudes: c.solicitudes.map((s) => ({
        ...s,
        creadaAt: new Date(s.creadaAt),
      })),
    })),
  };
}
