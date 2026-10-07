import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type {
  ChatsRepositoryPort,
  NuevoMensajeSaliente,
} from '../../application/ports/out/ChatsRepositoryPort';
import type { ConversacionResumen, MensajeChat } from '../../domain/Chats';
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
} from './whatsapp.schema';

const LARGO_PREVIEW = 120;

const columnasConversacion = {
  id: whatsappConversations.id,
  estado: whatsappConversations.estado,
  noLeidos: whatsappConversations.noLeidos,
  ultimoMensajeAt: whatsappConversations.ultimoMensajeAt,
  ultimoMensajePreview: whatsappConversations.ultimoMensajePreview,
  ultimoEntranteAt: whatsappConversations.ultimoEntranteAt,
  contactoId: whatsappContacts.id,
  waId: whatsappContacts.waId,
  profileName: whatsappContacts.profileName,
  sabaProfileId: whatsappContacts.sabaProfileId,
};

const columnasMensaje = {
  id: whatsappMessages.id,
  direccion: whatsappMessages.direccion,
  origen: whatsappMessages.origen,
  tipo: whatsappMessages.tipo,
  cuerpo: whatsappMessages.cuerpo,
  estado: whatsappMessages.estado,
  errorDetalle: whatsappMessages.errorDetalle,
  waTimestamp: whatsappMessages.waTimestamp,
};

function aConversacion(fila: {
  id: string;
  estado: 'abierta' | 'resuelta';
  noLeidos: number;
  ultimoMensajeAt: Date | null;
  ultimoMensajePreview: string | null;
  ultimoEntranteAt: Date | null;
  contactoId: string;
  waId: string | null;
  profileName: string | null;
  sabaProfileId: string | null;
}): ConversacionResumen {
  return {
    id: fila.id,
    contacto: {
      id: fila.contactoId,
      waId: fila.waId,
      profileName: fila.profileName,
      sabaProfileId: fila.sabaProfileId,
    },
    estado: fila.estado,
    noLeidos: fila.noLeidos,
    ultimoMensajeAt: fila.ultimoMensajeAt,
    ultimoMensajePreview: fila.ultimoMensajePreview,
    ultimoEntranteAt: fila.ultimoEntranteAt,
  };
}

function previewDe(cuerpo: string): string {
  const texto = cuerpo.trim();
  return texto.length > LARGO_PREVIEW
    ? `${texto.slice(0, LARGO_PREVIEW - 1)}…`
    : texto;
}

@Injectable()
export class DrizzleChatsRepository implements ChatsRepositoryPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async listarConversaciones(limite: number): Promise<ConversacionResumen[]> {
    const filas = await this.db
      .select(columnasConversacion)
      .from(whatsappConversations)
      .innerJoin(
        whatsappContacts,
        eq(whatsappContacts.id, whatsappConversations.contactId)
      )
      .orderBy(sql`${whatsappConversations.ultimoMensajeAt} desc nulls last`)
      .limit(limite);
    return filas.map(aConversacion);
  }

  async obtenerConversacion(id: string): Promise<ConversacionResumen | null> {
    const [fila] = await this.db
      .select(columnasConversacion)
      .from(whatsappConversations)
      .innerJoin(
        whatsappContacts,
        eq(whatsappContacts.id, whatsappConversations.contactId)
      )
      .where(eq(whatsappConversations.id, id));
    return fila ? aConversacion(fila) : null;
  }

  async listarMensajes(
    conversationId: string,
    limite: number
  ): Promise<MensajeChat[]> {
    const filas = await this.db
      .select(columnasMensaje)
      .from(whatsappMessages)
      .where(eq(whatsappMessages.conversationId, conversationId))
      .orderBy(
        desc(whatsappMessages.waTimestamp),
        desc(whatsappMessages.createdAt)
      )
      .limit(limite);
    return filas.reverse();
  }

  /** Mensaje y conversación son el mismo agregado: van en una transacción. */
  async registrarSaliente(mensaje: NuevoMensajeSaliente): Promise<MensajeChat> {
    return this.db.transaction(async (tx) => {
      const [creado] = await tx
        .insert(whatsappMessages)
        .values({
          conversationId: mensaje.conversationId,
          direccion: 'saliente',
          origen: 'sistema',
          tipo: 'text',
          cuerpo: mensaje.cuerpo,
          enviadoPor: mensaje.enviadoPor,
          estado: 'pendiente',
          waTimestamp: mensaje.waTimestamp,
        })
        .returning(columnasMensaje);
      if (!creado) throw new Error('no se guardó el mensaje');
      await tx
        .update(whatsappConversations)
        .set({
          ultimoMensajeAt: mensaje.waTimestamp,
          ultimoMensajePreview: previewDe(mensaje.cuerpo),
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversations.id, mensaje.conversationId));
      return creado;
    });
  }

  async confirmarEnvio(mensajeId: string, wamid: string): Promise<MensajeChat> {
    // Si un status de Meta llegó antes que esta respuesta, se ignoró por wamid
    // desconocido: `enviado` es lo mínimo que sabemos con certeza.
    const [mensaje] = await this.db
      .update(whatsappMessages)
      .set({ wamid, estado: 'enviado' })
      .where(eq(whatsappMessages.id, mensajeId))
      .returning(columnasMensaje);
    if (!mensaje) throw new Error('el mensaje enviado desapareció');
    return mensaje;
  }

  async registrarFalloEnvio(
    mensajeId: string,
    codigo: string | null,
    detalle: string
  ): Promise<void> {
    await this.db
      .update(whatsappMessages)
      .set({
        estado: 'fallido',
        errorCodigo: codigo,
        errorDetalle: detalle.slice(0, 2000),
      })
      .where(eq(whatsappMessages.id, mensajeId));
  }

  async marcarLeida(conversationId: string): Promise<boolean> {
    const actualizadas = await this.db
      .update(whatsappConversations)
      .set({ noLeidos: 0 })
      .where(eq(whatsappConversations.id, conversationId))
      .returning({ id: whatsappConversations.id });
    return actualizadas.length > 0;
  }
}
