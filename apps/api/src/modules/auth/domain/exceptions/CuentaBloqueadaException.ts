import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class CuentaBloqueadaException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_CUENTA_BLOQUEADA', cause);
  }
}
