import { Inject, Injectable } from '@nestjs/common';
import {
  ErrorEnvioMeta,
  type MensajeChat,
  ventanaAbierta,
} from '../../domain/Chats';
import { excepcionDeEnvio } from '../../domain/errorEnvio';
import {
  ContactoSinTelefonoException,
  ConversacionNoEncontradaException,
  VentanaCerradaException,
} from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ResponderConversacionPort } from '../ports/in/ResponderConversacionPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { ClockPort } from '../ports/out/ClockPort';
import type { WhatsAppCloudPort } from '../ports/out/WhatsAppCloudPort';

/**
 * El mensaje se guarda como `pendiente` antes de llamar a Meta: si la API se
 * cae a mitad, queda visible y no se pierde lo que escribió el agente.
 */
@Injectable()
export class ResponderConversacionUseCase implements ResponderConversacionPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WhatsAppCloud)
    private readonly cloud: WhatsAppCloudPort,
    @Inject(WHATSAPP_TOKENS.Clock) private readonly clock: ClockPort
  ) {}

  async execute({
    conversationId,
    cuerpo,
    enviadoPor,
  }: {
    conversationId: string;
    cuerpo: string;
    enviadoPor: string;
  }): Promise<MensajeChat> {
    const conversacion = await this.chats.obtenerConversacion(conversationId);
    if (!conversacion) throw new ConversacionNoEncontradaException();

    const ahora = this.clock.now();
    if (!ventanaAbierta(conversacion.ultimoEntranteAt, ahora)) {
      throw new VentanaCerradaException();
    }
    // Meta todavía no documenta cómo escribirle a un cliente solo por su
    // nombre de usuario: sin teléfono no hay a quién mandarle.
    const telefono = conversacion.contacto.waId;
    if (!telefono) throw new ContactoSinTelefonoException();

    const pendiente = await this.chats.registrarSaliente({
      conversationId,
      cuerpo,
      enviadoPor,
      waTimestamp: ahora,
    });

    try {
      const wamid = await this.cloud.enviarTexto(telefono, cuerpo);
      return await this.chats.confirmarEnvio(pendiente.id, wamid);
    } catch (error: unknown) {
      if (!(error instanceof ErrorEnvioMeta)) {
        await this.chats.registrarFalloEnvio(
          pendiente.id,
          null,
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
      await this.chats.registrarFalloEnvio(
        pendiente.id,
        error.codigo === null ? null : String(error.codigo),
        error.detalle
      );
      throw excepcionDeEnvio(error);
    }
  }
}
