import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class InvalidSessionException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_INVALID_SESSION', cause);
  }
}
