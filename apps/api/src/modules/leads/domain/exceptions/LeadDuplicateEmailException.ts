import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class LeadDuplicateEmailException extends DomainException {
  constructor(cause?: unknown) {
    super('LEADS_DUPLICATE_EMAIL', cause);
  }
}
