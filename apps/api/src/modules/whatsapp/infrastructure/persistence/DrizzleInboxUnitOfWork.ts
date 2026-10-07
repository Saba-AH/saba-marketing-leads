import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, or, type SQL, sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type {
  EventoWebhookPendiente,
  InboxTxScope,
  InboxUnitOfWork,
} from '../../application/ports/out/InboxUnitOfWork';
import type {
  CambioEstadoMensaje,
  EstadoMensaje,
  IdentidadContacto,
  MensajeEntrante,
} from '../../domain/Inbox';
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
  whatsappWebhookEvents,
} from './whatsapp.schema';

type ApiTx = Parameters<Parameters<ApiDb['transaction']>[0]>[0];

class DrizzleInboxScope implements InboxTxScope {
  constructor(private readonly tx: ApiTx) {}

  async tomarEvento(eventoId: string): Promise<EventoWebhookPendiente | null> {
    const [evento] = await this.tx
      .select({
        id: whatsappWebhookEvents.id,
        campo: whatsappWebhookEvents.campo,
        payload: whatsappWebhookEvents.payload,
      })
      .from(whatsappWebhookEvents)
      .where(
        and(
          eq(whatsappWebhookEvents.id, eventoId),
          isNull(whatsappWebhookEvents.procesadoAt)
        )
      )
      .for('update', { skipLocked: true });
    return evento ?? null;
  }

  async marcarProcesado(eventoId: string): Promise<void> {
    await this.tx
      .update(whatsappWebhookEvents)
      .set({ procesadoAt: new Date(), error: null })
      .where(eq(whatsappWebhookEvents.id, eventoId));
  }

  async asegurarContacto(
    { waId, userId }: IdentidadContacto,
    profileName: string | null
  ): Promise<string> {
    const coincidencias: SQL[] = [];
    if (userId) coincidencias.push(eq(whatsappContacts.userId, userId));
    if (waId) coincidencias.push(eq(whatsappContacts.waId, waId));

    const existentes = await this.tx
      .select({
        id: whatsappContacts.id,
        waId: whatsappContacts.waId,
        userId: whatsappContacts.userId,
      })
      .from(whatsappContacts)
      .where(or(...coincidencias))
      .limit(2);

    if (existentes.length === 0) {
      const [creado] = await this.tx
        .insert(whatsappContacts)
        .values({ waId, userId, profileName })
        .returning({ id: whatsappContacts.id });
      if (!creado) throw new Error('no se creó el contacto');
      return creado.id;
    }

    // Si el teléfono y el user_id caen en contactos distintos, se usa el del
    // user_id y no se completa nada: unirlos rompería el UNIQUE.
    const porUserId = existentes.find((c) => userId && c.userId === userId);
    const contacto = porUserId ?? existentes[0];
    if (!contacto) throw new Error('contacto inconsistente');
    const completar = existentes.length === 1;

    await this.tx
      .update(whatsappContacts)
      .set({
        ...(completar && !contacto.waId && waId ? { waId } : {}),
        ...(completar && !contacto.userId && userId ? { userId } : {}),
        ...(profileName ? { profileName } : {}),
        updatedAt: new Date(),
      })
      .where(eq(whatsappContacts.id, contacto.id));
    return contacto.id;
  }

  async asegurarConversacion(contactId: string): Promise<string> {
    await this.tx
      .insert(whatsappConversations)
      .values({ contactId })
      .onConflictDoNothing({ target: whatsappConversations.contactId });
    const [conversacion] = await this.tx
      .select({ id: whatsappConversations.id })
      .from(whatsappConversations)
      .where(eq(whatsappConversations.contactId, contactId));
    if (!conversacion) throw new Error('no se creó la conversación');
    return conversacion.id;
  }

  async insertarMensajeEntrante(
    conversationId: string,
    mensaje: MensajeEntrante
  ): Promise<boolean> {
    const insertados = await this.tx
      .insert(whatsappMessages)
      .values({
        conversationId,
        wamid: mensaje.wamid,
        direccion: 'entrante',
        origen: 'cliente',
        tipo: mensaje.tipo,
        cuerpo: mensaje.cuerpo,
        mediaId: mensaje.mediaId,
        waTimestamp: mensaje.waTimestamp,
      })
      .onConflictDoNothing({ target: whatsappMessages.wamid })
      .returning({ id: whatsappMessages.id });
    return insertados.length > 0;
  }

  async registrarEntrante(
    conversationId: string,
    mensaje: MensajeEntrante
  ): Promise<void> {
    const c = whatsappConversations;
    const momento = sql`${mensaje.waTimestamp.toISOString()}::timestamptz`;
    // GREATEST ignora NULL. Un mensaje viejo que llega tarde no pisa la
    // vista previa ni retrocede la ventana.
    await this.tx
      .update(c)
      .set({
        ultimoMensajeAt: sql`greatest(${c.ultimoMensajeAt}, ${momento})`,
        ultimoMensajePreview: sql`case when ${c.ultimoMensajeAt} is null or ${c.ultimoMensajeAt} <= ${momento} then ${mensaje.preview} else ${c.ultimoMensajePreview} end`,
        ...(mensaje.abreVentana
          ? {
              ultimoEntranteAt: sql`greatest(${c.ultimoEntranteAt}, ${momento})`,
            }
          : {}),
        noLeidos: sql`${c.noLeidos} + 1`,
        estado: 'abierta',
        updatedAt: new Date(),
      })
      .where(eq(c.id, conversationId));
  }

  async actualizarEstadoMensaje(
    cambio: CambioEstadoMensaje,
    desde: EstadoMensaje[]
  ): Promise<void> {
    if (desde.length === 0) return;
    await this.tx
      .update(whatsappMessages)
      .set({
        estado: cambio.estado,
        ...(cambio.estado === 'fallido'
          ? {
              errorCodigo: cambio.errorCodigo,
              errorDetalle: cambio.errorDetalle,
            }
          : {}),
      })
      .where(
        and(
          eq(whatsappMessages.wamid, cambio.wamid),
          inArray(whatsappMessages.estado, desde)
        )
      );
  }
}

@Injectable()
export class DrizzleInboxUnitOfWork implements InboxUnitOfWork {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async run<T>(work: (scope: InboxTxScope) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => work(new DrizzleInboxScope(tx)));
  }
}
