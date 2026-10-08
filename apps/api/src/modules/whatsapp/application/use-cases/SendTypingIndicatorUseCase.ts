import { Inject, Injectable } from '@nestjs/common';
import { isWindowOpen, MetaSendError } from '../../domain/Chats';
import {
  ConversationNotFoundException,
  WhatsAppNotConfiguredException,
} from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { SendTypingIndicatorPort } from '../ports/in/SendTypingIndicatorPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { ClockPort } from '../ports/out/ClockPort';
import type { WhatsAppCloudPort } from '../ports/out/WhatsAppCloudPort';

/**
 * A courtesy, not a feature: if it does not apply (window closed, a customer
 * who never wrote) or Meta rejects it, nothing happens. It must never get in
 * the way of whoever is typing the reply.
 */
@Injectable()
export class SendTypingIndicatorUseCase implements SendTypingIndicatorPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WhatsAppCloud)
    private readonly cloud: WhatsAppCloudPort,
    @Inject(WHATSAPP_TOKENS.Clock) private readonly clock: ClockPort
  ) {}

  async execute(conversationId: string): Promise<void> {
    const conversation = await this.chats.getConversation(conversationId);
    if (!conversation) throw new ConversationNotFoundException();
    if (!isWindowOpen(conversation.lastInboundAt, this.clock.now())) {
      return;
    }
    const wamid = await this.chats.lastInboundWamid(conversationId);
    if (!wamid) return;
    try {
      await this.cloud.sendTypingIndicator(wamid);
    } catch (error: unknown) {
      if (
        error instanceof MetaSendError ||
        error instanceof WhatsAppNotConfiguredException
      ) {
        return;
      }
      throw error;
    }
  }
}
