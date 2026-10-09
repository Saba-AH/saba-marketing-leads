import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class AccountLockedException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_ACCOUNT_LOCKED', cause);
  }
}
