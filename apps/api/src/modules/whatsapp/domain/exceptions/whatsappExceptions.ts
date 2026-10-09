import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class ConversationNotFoundException extends DomainException {
  constructor() {
    super('WHATSAPP_CONVERSATION_NOT_FOUND');
  }
}

export class MediaUnavailableException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_MEDIA_UNAVAILABLE', cause);
  }
}

export class WindowClosedException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_WINDOW_CLOSED', cause);
  }
}

export class ContactWithoutPhoneException extends DomainException {
  constructor() {
    super('WHATSAPP_CONTACT_WITHOUT_PHONE');
  }
}

export class WhatsAppNotConfiguredException extends DomainException {
  constructor() {
    super('WHATSAPP_NOT_CONFIGURED');
  }
}

export class RecipientNotAllowedException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_RECIPIENT_NOT_ALLOWED', cause);
  }
}

export class UndeliverableException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_UNDELIVERABLE', cause);
  }
}

export class InvalidWhatsAppTokenException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_INVALID_TOKEN', cause);
  }
}

export class TooManySendsException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_TOO_MANY_SENDS', cause);
  }
}

export class SendRejectedException extends DomainException {
  constructor(cause?: unknown) {
    super('WHATSAPP_SEND_REJECTED', cause);
  }
}
