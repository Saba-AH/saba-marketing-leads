import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class NoAccessException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_NO_ACCESS', cause);
  }
}
