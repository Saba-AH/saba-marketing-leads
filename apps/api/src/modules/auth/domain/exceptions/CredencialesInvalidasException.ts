import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class CredencialesInvalidasException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_CREDENCIALES_INVALIDAS', cause);
  }
}
