import { leadsMessages } from '../../modules/leads/infrastructure/i18n/messages';

/**
 * Catálogo único de mensajes de dominio, en español. Un módulo nuevo agrega su
 * catálogo de códigos en su propio `infrastructure/i18n/messages.ts` y lo suma
 * acá en el mismo PR que sus excepciones, junto con su estado HTTP en
 * `DomainToHttpMapper`.
 */
export type DomainErrorCode = keyof typeof leadsMessages;

export const domainMessages: Record<DomainErrorCode, string> = {
  ...leadsMessages,
};

export function resolveDomainMessage(code: string): string | undefined {
  return (domainMessages as Record<string, string>)[code];
}
