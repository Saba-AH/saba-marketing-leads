import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class SinAccesoException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_SIN_ACCESO', cause);
  }
}
