import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class TooManyAttemptsException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_TOO_MANY_ATTEMPTS', cause);
  }
}
