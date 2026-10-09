import { DomainException } from '../../../../infrastructure/errors/DomainException';

/** Saba did not answer, answered something unexpected or rejected the service key. */
export class AuthUnavailableException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_UNAVAILABLE', cause);
  }
}
