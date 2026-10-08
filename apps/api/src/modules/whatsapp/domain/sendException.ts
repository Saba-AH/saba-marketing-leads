import type { DomainException } from '../../../infrastructure/errors/DomainException';
import type { MetaSendError } from './Chats';
import {
  InvalidWhatsAppTokenException,
  RecipientNotAllowedException,
  SendRejectedException,
  TooManySendsException,
  UndeliverableException,
  WindowClosedException,
} from './exceptions/whatsappExceptions';

/** Codes from https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes */
export function sendException(error: MetaSendError): DomainException {
  switch (error.code) {
    case 131047:
      return new WindowClosedException(error);
    case 131030:
      return new RecipientNotAllowedException(error);
    case 131026:
      return new UndeliverableException(error);
    case 190:
      return new InvalidWhatsAppTokenException(error);
    case 131056:
    case 130429:
    case 80007:
      return new TooManySendsException(error);
    default:
      return new SendRejectedException(error);
  }
}
