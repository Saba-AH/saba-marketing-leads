import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class DemasiadosIntentosException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_DEMASIADOS_INTENTOS', cause);
  }
}
