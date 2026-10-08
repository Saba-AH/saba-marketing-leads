import { Inject, Injectable } from '@nestjs/common';
import { InvalidWebhookPayloadException } from '../../domain/exceptions/InvalidWebhookPayloadException';
import { type InboxAction, statusesThatAdvanceTo } from '../../domain/Inbox';
import { parseWebhook } from '../../domain/parseWebhook';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  ProcessingResult,
  ProcessWebhookEventPort,
} from '../ports/in/ProcessWebhookEventPort';
import type {
  InboxTxScope,
  InboxUnitOfWork,
} from '../ports/out/InboxUnitOfWork';
import type { WebhookEventRepositoryPort } from '../ports/out/WebhookEventRepositoryPort';

function describeError(error: unknown): string {
  if (error instanceof InvalidWebhookPayloadException) {
    return `${error.message}: ${error.detail}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Called by the event handler (right away) and by the sweep (retries): an
 * event is processed whole in one transaction and marked, so running it twice
 * duplicates nothing. Saba data is not looked up here but when the chat is
 * opened (`GetSabaCustomerUseCase`).
 */
@Injectable()
export class ProcessWebhookEventUseCase implements ProcessWebhookEventPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.InboxUnitOfWork)
    private readonly uow: InboxUnitOfWork,
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly events: WebhookEventRepositoryPort
  ) {}

  async execute(eventId: string): Promise<ProcessingResult> {
    try {
      const processed = await this.uow.run(async (scope) => {
        const event = await scope.claimEvent(eventId);
        if (!event) return false;
        // In order: a payload can carry the message and then its status.
        for (const action of parseWebhook(event.field, event.payload)) {
          await this.apply(scope, action);
        }
        await scope.markProcessed(eventId);
        return true;
      });
      return processed ? 'processed' : 'skipped';
    } catch (error: unknown) {
      await this.events.registerFailure(eventId, describeError(error));
      return 'failed';
    }
  }

  private async apply(scope: InboxTxScope, action: InboxAction): Promise<void> {
    switch (action.type) {
      case 'inboundMessage': {
        const { message } = action;
        const contactId = await scope.ensureContact(
          message.identity,
          message.profileName
        );
        const conversationId = await scope.ensureConversation(contactId);
        const isNew = await scope.insertInboundMessage(conversationId, message);
        if (isNew) await scope.registerInbound(conversationId, message);
        return;
      }
      case 'statusChange':
        await scope.updateMessageStatus(
          action.change,
          statusesThatAdvanceTo(action.change.status)
        );
        return;
    }
  }
}
