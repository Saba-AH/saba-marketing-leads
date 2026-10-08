import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class SabaUnavailableException extends DomainException {
  constructor(cause?: unknown) {
    super('SABA_CUSTOMERS_UNAVAILABLE', cause);
  }
}

/** Saba answered 401: the agent's token is not from its Supabase or has expired. */
export class SabaSessionNotRecognizedException extends DomainException {
  constructor(cause?: unknown) {
    super('SABA_CUSTOMERS_SESSION_NOT_RECOGNIZED', cause);
  }
}

export class SabaForbiddenException extends DomainException {
  constructor(cause?: unknown) {
    super('SABA_CUSTOMERS_FORBIDDEN', cause);
  }
}
