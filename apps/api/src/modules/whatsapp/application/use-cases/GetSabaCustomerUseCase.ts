import { Inject, Injectable } from '@nestjs/common';
import { ConversationNotFoundException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  ChatSabaCustomers,
  GetSabaCustomerPort,
} from '../ports/in/GetSabaCustomerPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { SabaCustomersPort } from '../ports/out/SabaCustomersPort';

/**
 * Queried when the chat is opened (one lookup per opened chat), not when
 * listing or receiving messages: Saba is the only source of its customers.
 */
@Injectable()
export class GetSabaCustomerUseCase implements GetSabaCustomerPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.SabaCustomers)
    private readonly sabaCustomers: SabaCustomersPort
  ) {}

  async execute(
    conversationId: string,
    credential: string
  ): Promise<ChatSabaCustomers> {
    const conversation = await this.chats.getConversation(conversationId);
    if (!conversation) throw new ConversationNotFoundException();
    const phone = conversation.contact.waId;
    if (!phone) return { noPhone: true, customers: [] };
    return {
      noPhone: false,
      customers: await this.sabaCustomers.findByPhone(phone, credential),
    };
  }
}
