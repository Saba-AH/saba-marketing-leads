import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class InvalidCredentialsException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_INVALID_CREDENTIALS', cause);
  }
}
