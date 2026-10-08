import { authMessages } from '../../modules/auth/infrastructure/i18n/messages';
import { leadsMessages } from '../../modules/leads/infrastructure/i18n/messages';
import { sabaClientesMessages } from '../../modules/sabaClientes/infrastructure/i18n/messages';
import { whatsappMessages } from '../../modules/whatsapp/infrastructure/i18n/messages';

/**
 * Catálogo único de mensajes de dominio, en español. Un módulo nuevo agrega su
 * catálogo de códigos en su propio `infrastructure/i18n/messages.ts` y lo suma
 * acá en el mismo PR que sus excepciones, junto con su estado HTTP en
 * `DomainToHttpMapper`.
 */
export type DomainErrorCode =
  | keyof typeof authMessages
  | keyof typeof leadsMessages
  | keyof typeof sabaClientesMessages
  | keyof typeof whatsappMessages;

export const domainMessages: Record<DomainErrorCode, string> = {
  ...authMessages,
  ...leadsMessages,
  ...sabaClientesMessages,
  ...whatsappMessages,
};

export function resolveDomainMessage(code: string): string | undefined {
  return (domainMessages as Record<string, string>)[code];
}
