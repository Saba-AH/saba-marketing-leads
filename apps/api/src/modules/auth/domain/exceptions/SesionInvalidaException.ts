import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class SesionInvalidaException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_SESION_INVALIDA', cause);
  }
}
