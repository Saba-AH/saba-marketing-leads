import { Inject, Injectable } from '@nestjs/common';
import { ErrorEnvioMeta, ventanaAbierta } from '../../domain/Chats';
import {
  ConversacionNoEncontradaException,
  WhatsAppNoConfiguradoException,
} from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { IndicarEscribiendoPort } from '../ports/in/IndicarEscribiendoPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { ClockPort } from '../ports/out/ClockPort';
import type { WhatsAppCloudPort } from '../ports/out/WhatsAppCloudPort';

/**
 * Cortesía, no funcionalidad: si no corresponde (ventana cerrada, cliente que
 * nunca escribió) o Meta lo rechaza, no pasa nada. Nunca debe trabar a quien
 * está escribiendo la respuesta.
 */
@Injectable()
export class IndicarEscribiendoUseCase implements IndicarEscribiendoPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WhatsAppCloud)
    private readonly cloud: WhatsAppCloudPort,
    @Inject(WHATSAPP_TOKENS.Clock) private readonly clock: ClockPort
  ) {}

  async execute(conversationId: string): Promise<void> {
    const conversacion = await this.chats.obtenerConversacion(conversationId);
    if (!conversacion) throw new ConversacionNoEncontradaException();
    if (!ventanaAbierta(conversacion.ultimoEntranteAt, this.clock.now())) {
      return;
    }
    const wamid = await this.chats.ultimoWamidEntrante(conversationId);
    if (!wamid) return;
    try {
      await this.cloud.indicarEscribiendo(wamid);
    } catch (error: unknown) {
      if (
        error instanceof ErrorEnvioMeta ||
        error instanceof WhatsAppNoConfiguradoException
      ) {
        return;
      }
      throw error;
    }
  }
}
