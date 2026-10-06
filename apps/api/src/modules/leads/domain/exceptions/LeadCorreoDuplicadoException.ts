import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class LeadCorreoDuplicadoException extends DomainException {
  constructor(cause?: unknown) {
    super('LEADS_CORREO_DUPLICADO', cause);
  }
}
